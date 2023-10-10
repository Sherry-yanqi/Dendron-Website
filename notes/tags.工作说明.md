---
id: 0liorsjk4fxvyj22kj99uyx
title: 工作说明
desc: ''
updated: 1696909320884
created: 1695366403489
---

## 环境
## 目标
- 搭一个rockml的环境，运行pytorch模型
- 在5.5服务器上运行gem5+rocm
    - 搭建好http代理环境以及github下载环境
    - 编译gem5
    - 编译
        1. Heterogeneous Compute Compiler (HCC)
        1. Radeon Open Compute runtime (ROCr)
        1. Radeon Open Compute thunk (ROCt)
        1. HIP
    - 运行HIP_EXAMPLE 中的hello world
## 安装
### 注意
* GCN3只能工作在system-call emulation (SE) mode，In particular, the emulated GPU driver supports the necessary ioctl() commands it receives from the userspace code. The source for the emulated GPU driver can be found in:
    - The GPU compute driver: src/gpu-compute/gpu_compute_driver.[hh|cc]
    - The HSA device driver: src/dev/hsa/hsa_driver.[hh|cc]
* The HSA driver code models the basic functionality for an HSA agent, which is any device that can be targeted by the HSA runtime and accepts Architected Query Language (AQL) packets. AQL packets are a standard format for all HSA agents, and are used primarily to initiate kernel launches on the GPU. The base HSADriver class holds a pointer to the HSA packet processor for the device, and defines the interface for any HSA device. An HSA agent does not have to be a GPU, it could be a generic accelerator, CPU, NIC, etc.
    The GPUComputeDriver derives from HSADriver and is a device-specific implementation of an HSADriver. It provides the implementation for GPU-specific ioctl() calls.

    The src/dev/hsa/kfd_ioctl.h header must match the kfd_ioctl.h header that comes with ROCt. The emulated driver relies on that file to interpret the ioctl() codes the thunk uses.
### 安装选择
* **在用户目录下安装依赖项**
    - zlib      v1.3.01 源码安装
    - sqlit3(需要在python安装前安装， 在python的configure命令，一定要添加-enable-loadable-sqlite-extensions，因为默认是不开启的)，v3.44.0 源码安装
    - python3， v3.6.15  源码安装
    configure 时别忘了--enable-shared
    --prefix=$HOME/tools --enable-loadable-sqlite-extensions 
    - protobuf  v3.5.0  系统自带
    - m4        v1.4.18  源码安装
    - scons     v4.0.0  pip3安装，其他版本报错
    - openmpi   v4.1.5 源码安装（boost的图形库需要，故安装）
    - boost     v1.83.0    源码安装
    - gem5 v23.0.1.0
  
* ** 选择ROCm version 4.0.0 **
    - Heterogeneous Compute Compiler (HCC)
    - Radeon Open Compute runtime (ROCr)
    - Radeon Open Compute thunk (ROCt)
    - HIP
* pytorch v1.8.0
    - pip install torch -f https://download.pytorch.org/whl/rocm4.0.1/torch_stable.html
    - pip install ninja
    - pip install 'git+https://github.com/pytorch/vision.git@v0.9.0'
### 安装过程
1. 安装所需依赖
2. 安装所需要的python第三方包，gem5根目录下有requirement.txt
3. gem5编译，编译（各个依赖版本）
4. 安装[MESA](mesahttps://github.com/Mesa3D/mesa.git)
    - 依赖macros:
        ```
        //注意把安装位置，设置一下环境变量
        export ACLOCAL_PATH=$HOME/tools/share/aclocal
         ```
  
    - https://gitlab.freedesktop.org/xorg/lib/libxshmfence/-/tree/master?ref_type=heads
    - pip install Mako
5. 安装llvm(git clone -b rocm-4.0.0 https://github.com/RadeonOpenCompute/llvm-project.git)
6. 
安装HIP（注意安装hip依赖，mesa-common-dev，clang，comgr，rocm-dkms）
7. 下载hip-example，并调用其中的helloworld程序
    运行命令
```shell
build/GCN3_X86/gem5.opt configs/example/apu_se.py -n 3 -c ~/rocm-4.0.0/HIP-Examples/HIP-Examples-Applications/HelloWorld/HelloWorld
```
执行Hello world过程报错
* hip程序找不到libamd_comgr动态库
    原因是apu_se.py文件中重新设置了动态库路径，故不包含libamd_comgr动态库
    修改apu_se.py
```python
env = ['LD_LIBRARY_PATH=%s' % ':'.join([
            os.getenv('ROCM_PATH','/opt/rocm')+'/lib',
            os.getenv('HCC_HOME','/opt/rocm/hcc')+'/lib',
            os.getenv('HSA_PATH','/opt/rocm/hsa')+'/lib',
            os.getenv('HIP_PATH','/opt/rocm/hip')+'/lib',
            os.getenv('ROCM_PATH','/opt/rocm')+'/libhsakmt/lib',
            os.getenv('ROCM_PATH','/opt/rocm')+'/miopen/lib',
            os.getenv('ROCM_PATH','/opt/rocm')+'/miopengemm/lib',
            os.getenv('ROCM_PATH','/opt/rocm')+'/hipblas/lib',
            os.getenv('ROCM_PATH','/opt/rocm')+'/rocblas/lib',
            "/usr/lib/x86_64-linux-gnu",
            "/home/lixianrui/tools/lib64"
        ]),
        'HOME=%s' % os.getenv('HOME','/'),
        "HSA_ENABLE_INTERRUPT=1"]
```
* 报错，fatal: syscall getdents64 (#217) unimplemented.
    解决[](https://gem5-review.googlesource.com/c/public/gem5/+/46242)
    报错request to allocate mask for invalid number: Invalid argument
    解决按照[](https://gem5-review.googlesource.com/c/public/gem5/+/46243) 实现sched_getaffinity 系统调用
* fatal: system.cpu3.CUs0 does not have any port named gmTokenPort。本周已经解决，查找到原因是gmTokenPort系统调用未实现，查找gem5的提交记录，从新版中找到实现，修改代码调试程序中进行对程序进行跟踪，解决bug。
    错误解决[](https://gem5-review.googlesource.com/c/public/gem5/+/35096)
* request to allocate mask for invalid number: Invalid argument
    实现了sched_getaffinity 系统调用
    附带着学习了gdb使用，并用gdb工具跟踪gem5 debug程序。
* panic: Tried to read unmapped address 0x8
 首先查到这个错误是在/src/x86下，故是发生在了gem5里面
```shell
执行命令：build/GCN3_X86/gem5.opt configs/example/apu_se.py  -c ~/rocm-4.0.0/HIP-Examples-rocm-4.0.0/HIP-Examples-Applications/FloydWarshall/FloydWarshall
报错
warn: ignoring syscall get_mempolicy(...)
panic: Tried to read unmapped address 0x8.
PC: 0x7ffff8013e08, Instr:   CALL_NEAR_M : ld   t1, DS:[rbx]
Memory Usage: 5724524 KBytes
执行命令：build/GCN3_X86/gem5.opt configs/example/apu_se.py  -c ~/rocm-4.0.0/HIP-Examples-rocm-4.0.0/HIP-Examples-Applications/HelloWorld/HelloWorld
报错
warn: ignoring syscall get_mempolicy(...)
panic: Tried to read unmapped address 0x8.
PC: 0x7ffff8013e08, Instr:   CALL_NEAR_M : ld   t1, DS:[rbx]
执行命令：
build/GCN3_X86/gem5.opt configs/example/apu_se.py  -c ~/rocm-4.0.0/HIP-Examples-rocm-4.0.0/HIP-Examples-Applications/SimpleConvolution/SimpleConvolution
报错
warn: ignoring syscall get_mempolicy(...)
panic: Tried to read unmapped address 0x8.
PC: 0x7ffff8013e08, Instr:   CALL_NEAR_M : ld   t1, DS:[rbx]
执行命令$build/GCN3_X86/gem5.opt configs/example/apu_se.py  -c gem5-resources/src/gpu/square/bin/square
报错：warn: ignoring syscall get_mempolicy(...)
info: Increasing stack size by one page.
warn: instruction 'fcomi' unimplemented
panic: Tried to read unmapped address 0x8.
PC: 0x7ffff8013e08, Instr:   CALL_NEAR_M : ld   t1, DS:[rbx]
Memory Usage: 5741540 KBytes
```
根据warn: instruction 'fcomi' unimplemented查找有关提交，找到了[](https://gem5-review.googlesource.com/c/public/gem5/+/42443)关于fcomi的相关提交，用strance记录gem5调用记录，发现在最后gem5确实有调用libstdc++，报错指令CALL_NEAR_M : ld   t1, DS:[rbx]定义在./src/arch/x86/isa/insts/general_purpose/control_transfer/call.py。猜测或许有关，比较玄学，结果证明无关
###资料列表
[链接Documentation and Tutorials部分](https://www.gem5.org/documentation/general_docs/gpu_models/GCN3)
[rocm仓库](http://repo.radeon.com/rocm/archive/)