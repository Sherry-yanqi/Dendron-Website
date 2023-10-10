Shader,位置src/gpu-compute/shader.cc
# Memory system #
## 设计目标 ##
Todo
## 组件 ##
[reference website](https://www.gem5.org/documentation/learning_gem5/part2/memoryobject/)
[reference website](https://dingfen.github.io/cpp/2022/04/02/gem5-4.html#memory-system-modes)
### Ports ###
在深入研究内存系统之前，我们应该首先理解 gem5 中的端口类 Port。因为所有在内存系统内的对象都要通过端口来建立连接，因而它们总是成对出现，这使得 gem5 的设计更加模块化。
#### Memory system modes ####
* 时序（timing）最重要的模式是时序模式。时序模式是产生正确仿真结果的唯一模式。其他模式仅在特殊情况下使用：
* Atomic mode 原子模式常用于快进到感兴趣的模拟区域，以及预热缓存，这种模式假设在内存系统中不会产生任何事件。相反，所有的内存请求都通过一个长调用链执行。除非它将在快进或模拟器预热期间使用，否则不需要实现对内存对象的原子访问。
* Functional mode 功能模式更适合描述为调试模式。功能模式用于从 host 读取数据到模拟器内存等操作。它在 Syscall Emulation(SE) 模式中被大量使用。例如，函数模式使用 process.cmd 从 host 中加载二进制文件，这样模拟系统就可以访问它。不论数据在何处，函数的读操作总能返回最新的数据，而其写操作中需要更新所有可能的有效数据（比如多个有效的缓存块中）。
#### Port #####
Port 类（端口）是 SimObject 之间的交互接口。在 gem5 中，Port 类是所有交互接口类（包括网络连接以及硬件模块端口连接等）的父类，其地位可见一斑。
``` C++
class Port {
  private:
    const std::string portName;
    const PortID id;
    Port *_peer;
    bool _connected;
  protected:
	class UnboundPortException {};
  public:
    Port(const std::string& _name, PortID _id)
      : portName(_name), id(_id), _peer(nullptr), _connected(false)
};
```
* portName 是端口的描述名
* id 类型为 typename int16_t PortID，用于在 vector 中区分并识别端口，当 id 为负数时，指示端口不在 vector 中。
* _peer 指向与该端口相连的端口，
* _connected 表示端口是否有一个端口与之相连。
* 空类 UnboundPortException，用于在程序发现未绑定端口时 throw 出特定的错误。
成对的两个端口如何进行绑定与解绑呢？很简单，只需要改变 _peer 指针就行：

```C++
/** Attach to a peer port. */
virtual void bind(Port &peer) {
  _peer = &peer;
  _connected = true;
}

/** Dettach from a peer port. */
virtual void unbind() {
  _peer = nullptr;
  _connected = false;
}
```
takeOverFrom() 函数也提供了快速交换两个端口之间连接的方法。它将原本与 old 绑定的端口绑定。
```C++
void takeOverFrom(Port *old) {
  Port &peer = old->getPeer();
  // Disconnect the original binding.
  old->unbind();
  peer.unbind();
  // Connect the new binding.
  peer.bind(*this);
  bind(peer);
}
```














抽象内存对象（MemObject）
    Gem5所有的内存对象都继承自MemObject，看过源码可以发现MemObject对象继承于ClockedObject对象，且仅添加了两个纯虚函数getMasterPort(const std::string &name)以及getSlavePort(const std::string &name)，这两个方法分别用来获得主从接口的名称。
端口（port）:
    端口用来连接不同的内存对象，比如主端口（A类）连接从端口（B类），然后主端口（B类）连接从端口（C类）。主端口用来发送请求，与它连接的从端口接受请求，它们内部会有一对方法来实现请求的发送与接收。比如A类->sendTimingReq(pkt)以发送数据包，B类->recvTimingReq(pkt)接收。当然还有其他这样的方法对，比如（sendFunctional(Pkt)和recvFunctional(Pkt)）。每个内存对象至少拥有一个端口用于与整个系统连接。
连接端口
       连接端口的过程是在Python脚本中配置的，通过类似A.port1 = B.port2的语句就可以将两个内存对象连接起来，需要注意的是Gem5对于例如总线这类可能拥有无限多对端口的对象会维护一个vector port来记录每一对连接到它上面的端口。对于vector port每一对新的连接会添加到vector的末尾，而一般的port会覆盖掉之前的连接。
端口代理：
       一共有三种，其中PortProxy提供方法来写入和读取物理地址。它仅用于在模拟开始之前将数据加载到内存中并更新。SETranslatingPortProxy和FSTranslatingPortProxy提供与 PortProxy相同的方法，但传递给它们的地址是虚拟地址，并进行转换以获得物理地址。
数据包（packet）：
数据包用于封装内存系统中两个对象之间的传输，它一般包括以下数据

        1.地址。这是将用于将数据包路由到其目标（如果未明确设置目的地）并在目标处处理数据包的地址。它通常源自请求对象的物理地址，但在某些情况下可能源自虚拟地址（例如，在执行地址转换之前访问完全虚拟缓存）。它可能与原始请求地址不同：例如，在缓存未命中时，数据包地址可能是要获取的块的地址，而不是请求地址。

       2.The size。大小可能与原始请求的大小不同，如缓存未命中情况。

       3.指向正在处理的数据的指针。由dataStatic()和dataDynamic()设置，它控制数据包释放时是否释放与数据包关联的数据。如果未通过上述方法之一设置，则分在数据包销毁时释放数据。可以通过调用getPtr()或getConstPtr()检索指针。get()和set()方法可用于操纵该数据包中的数据。get() 方法执行客机到主机的字节序转换，而 set 方法执行主机到客机的字节序转换。

       4.与数据包关联的命令属性列表。

       5.一个SenderState指针，它是一个虚拟基础不透明结构，用于保存与数据包关联的特定发送设备（例如，MSHR）的状态。在数据包的响应中返回指向此状态的指针，以便发送方可以快速查找处理它所需的状态。一个特定的子类将由此派生，以携带特定发送设备的状态。

       6.指向请求的指针。

请求对象封装了从CPU/IO发出的请求。请求对象的各个参数在事物的进行中保持不变，因此，对于给定的请求，请求对象的字段最多只能写入一次。有一些构造函数和更新方法允许在不同的时间写入对象字段的子集（或者根本不写入）。访问器方法提供对所有请求字段的读取访问，并验证正在读取的字段中的数据是否有效。

请求对象中的字段通常对实际系统中的设备不可用，因此它们通常仅用于统计或调试，而不是用作体系结构参数。

请求对象字段包括：

        1.虚拟地址。如果请求直接在物理地址上发出（例如，由DMA I/O设备发出），则此字段可能无效。

        2.物理地址。

        3.数据大小。

        4.创建请求的时间。

        5.导致此请求的CPU/线程的ID。如果请求不是由CPU发出的（例如，设备访问或缓存写回），则可能无效。

        6.导致此请求的PC。如果请求不是由CPU发出的，也可能无效。

原子/时序/功能 三种访问：

一般端口都支持这三种访问方式

        1.时序访问。时序访问是最详细的访问。它反应了最接近真实情况的建模方式，包括排队延迟和资源争用的建模。一旦在将来某个时间点成功发送时序请求，发送请求的设备将得到响应。定时和原子访问不能在内存系统中共存。这类似于TLM nb_传输接口。

        2.原子访问是一种更快的访问方式。它们用于快速转发和预热缓存，并返回完成请求的大致时间，而不会出现任何资源争用或排队延迟。当发送原子访问时，函数返回时将提供响应。原子访问和定时访问不能在内存系统中共存。这类似于TLM b_传输接口（无任何阻塞）。

        3.函数式原子访问函数式访问是瞬时发生的，但与原子访问不同，它们可以与原子访问或定时访问共存于内存系统中。函数访问用于加载二进制文件、检查/更改模拟系统中的变量，以及允许将远程调试器连接到模拟器。重要的注意事项是，当设备接收到功能访问时，如果它包含一个数据包队列，则必须搜索所有数据包，以查找功能访问正在影响的请求或响应，并且必须根据需要对其进行更新。Packet:：trySatisfyFunctional（）负责此操作。

时序流的控制

        计时请求模拟真实的内存系统，因此与函数和原子访问不同，它们的响应不是瞬时的。因为定时请求不是瞬时的，所以需要流的控制。当通过sendTiming（）发送定时数据包时，数据包可能被接受，也可能不被接受，返回true或false。如果返回false，则对象在收到recvry（）调用之前不应尝试再发送数据包。此时，它应该再次尝试调用sendTiming（）；然而，分组可能再次被拒绝。注意：不需要重新发送原始数据包，可以发送更高优先级的数据包。

响应

       内存系统中的范围是通过让所有从端口为GetAddRanges提供一个实现来处理的。此方法返回一个包含其响应地址的AddressRangeList。当这些范围发生变化时（例如，从PCI配置开始），设备应在其端口上调用sendRangeChange，以便将新范围传播到整个层次结构。这正是init（）期间发生的情况；所有内存对象都调用sendRangeChange（），并且会发生一连串的范围更新，直到每个人的范围都已传播到系统中的所有总线。
