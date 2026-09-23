# PTP Boundary Clock Demo


## 1 Objective

Demonstrate a GNSS-referenced PTP boundary clock that distributes accurate time from DUT1 to DUT2.

## 2 Test Topology

The topology is NEO-M8T GNSS to PCB135 (DUT1), which acts as a GNSS-slaved boundary clock and grandmaster, then Ethernet PTP to EVB-LAN9668 (DUT2), which acts as a slave boundary clock.

![Timing PTP Clock Block Diagram](assets/timing-ptp-demo-block-diagram.png)

The topology diagram is represented by the topology below.

```{ .text .no-copy }
NEO-M8T GNSS
  1PPS  ──► PCB135 io-pin 2  (3.3 V direct, NOT through RS-422)
  NMEA  ──► MAX485 ──► ttyS1 (RS-422, 9600 8N1)

PCB135 (DUT1)                         EVB-LAN9668 (DUT2)
Boundary Clock, Grandmaster          Boundary Clock, Slave
Virtual port 58 slaved to GNSS        Slaved to DUT1

  Clock: ca:69:dd:ff:fe:e9:bb:b9
  GM:    ca:69:dd:ff:fe:e9:bb:bd (VP)
  Class 6, Accuracy 100 ns

    Gi 1/4  ── PTP Master ──────────── Gi 1/2  PTP Slave
```

DUT1 slaves its virtual port to the GNSS 1PPS and acts as grandmaster (class 6, accuracy 100 ns). DUT2 slaves to DUT1 over Ethernet.

---

## 3 PCB135 (DUT1) Configuration

Log-in as Admin to PCB135 using **`ICLI`**, then configure the following:

!!! tip

	Clear all switch configuration back to default but keep the switch's IP address
	```console
	# reload defaults keep-ip force
	```

```console
# configure terminal
```

```console
(config)# ! PTP, boundary clock, grandmaster
(config)# ptp 0 mode boundary onestep ethernet twoway vid 1 0 profile ieee1588 mep 1
(config)# ptp 0 filter-type basic
(config)# ptp 0 source-time-inaccuracy 0
(config)# ptp 0 gm-time-inaccuracy 0
(config)# ptp 0 dist-time-inaccuracy 0
(config)# ptp 0 virtual-port mode pps-in 2 pps-delay 5
(config)# ptp 0 virtual-port tod ser proto rmc
(config)# ptp rs422 baudrate 9600 parity none wordlength 8 stopbits 1 flowctrl none
```

```console
(config)# ! PTP Port Configuration on Gi 1/4
(config)# interface GigabitEthernet 1/4
(config-if)# ptp 0
(config-if)# ptp 0 announce interval 1 timeout 3
(config-if)# ptp 0 sync-interval -4
(config-if)# ptp 0 delay-mechanism e2e
(config-if)# ptp 0 delay-req interval -4
(config-if)# ptp 0 delay-asymmetry 0
(config-if)# ptp 0 ingress-latency 0
(config-if)# ptp 0 egress-latency 0
(config-if)# exit
(config)# exit
```

---

## 4 EVB-LAN9668 (DUT2) Configuration

Log-in as Admin to EVB-LAN9668 using **`ICLI`**, then configure the following:

!!! tip

	Clear all switch configuration back to default but keep the switch's IP address
	```console
	# reload defaults keep-ip force
	```

```console
# configure terminal
```

```console
(config)# ! PTP, boundary clock, slave
(config)# ptp 0 mode boundary onestep ethernet twoway vid 1 0 profile ieee1588 mep 1
(config)# ptp 0 filter-type basic
```

```console
(config)# ! PTP Port Configuration on Gi 1/2
(config)# interface GigabitEthernet 1/2
(config-if)# ptp 0
(config-if)# ptp 0 announce interval 1 timeout 3
(config-if)# ptp 0 sync-interval -3
(config-if)# ptp 0 delay-mechanism e2e
(config-if)# ptp 0 delay-req interval 0
(config-if)# ptp 0 delay-asymmetry 0
(config-if)# ptp 0 ingress-latency 0
(config-if)# ptp 0 egress-latency 0
(config-if)# exit
(config)# exit
```

**Differences from DUT1:**

| Parameter | DUT1 (.158) | DUT2 (.68) | Note |
|---|---|---|---|
| `sync-interval` | -4 (16/s) | -3 (8/s) | DUT2 uses a slightly lower rate |
| `delay-req interval` | -4 | 0 (1/s) | DUT2 uses slower delay requests |
| Virtual port | pps-in 2, ToD RMC | none | DUT2 has no GNSS input |

---

## 5 Verification

### 5.1 PCB135, check grandmaster state:
```console
# show ptp 0 slave
```
```{ .text .no-copy }
Slave port  Slave state    Holdover(ppb)
----------  -------------  -------------
58          PHASE_LOCKED   N.A.
```

```console
# show ptp 0 current
```
```{ .text .no-copy }
stpRm  OffsetFromMaster    MeanPathDelay
-----  ------------------  ------------------
1       0.000,000,000,171   0.000,000,000,000
```
`stpRm=1`, one step removed from the GNSS grandmaster (virtual port). `OffsetFromMaster` of ~171 ps confirms the BC is tightly locked to its own virtual port.

### 5.2 PCB135, check port state:

```console
# show ptp 0 port-state
```
```{ .text .no-copy }
Port  Enabled  PTP-State  Internal  Link  Port-Timer  Vlan-forw  Phy-timestamper  Peer-delay
----  -------  ---------  --------  ----  ----------  ---------  ---------------  ----------
   4  TRUE     mstr       FALSE     Up    In Sync     Forward    TRUE             OK
VirtualPort  Enabled  PTP-State  Io-pin
-----------  -------  ---------  ------
         58  TRUE     slve            2
```
Port 4 in `mstr`, distributing time to DUT2. `VirtualPort 58` must be `slve`, not `lstn`.

```console
# show ptp 0 parent
```
```{ .text .no-copy }
Parent / GM: ca:69:dd:ff:fe:e9:bb:bd  (= virtual port)
GM quality:  Cl:006  Ac:100 ns  Va:65535
```

### 5.3 EVB-LAN9668, check slave state:
```console
# show ptp 0 slave
```
```{ .text .no-copy }
Slave port  Slave state    Holdover(ppb)
----------  -------------  -------------
2           PHASE_LOCKED   N.A.
```

```console
# show ptp 0 current
```
```{ .text .no-copy }
stpRm  OffsetFromMaster    MeanPathDelay
-----  ------------------  ------------------
2       0.000,000,003,397   0.000,000,008,611
```
`stpRm=2`, two steps from the GNSS (DUT1 virtual port → DUT1 BC → DUT2). `OffsetFromMaster` ~3.4 ns and `MeanPathDelay` ~8.6 ns are typical for a direct cable with one-step hardware timestamping.

```console
# show ptp 0 port-state
```
```{ .text .no-copy }
Port  Enabled  PTP-State  Internal  Link  Port-Timer  Vlan-forw  Phy-timestamper  Peer-delay
----  -------  ---------  --------  ----  ----------  ---------  ---------------  ----------
   2  TRUE     slve       FALSE     Up    In Sync     Forward    TRUE             OK
```

```console
# show ptp 0 parent
```
```{ .text .no-copy }
Parent: ca:69:dd:ff:fe:e9:bb:b9 port 4  (= DUT1 Gi 1/4)
GM:     ca:69:dd:ff:fe:e9:bb:bd  Cl:006  Ac:100 ns  (= DUT1 virtual port / GNSS)
```

---

## 6 Results

### 6.1 PCB135 (DUT1)

```{ .text .no-copy }
show ptp 0 default
  DeviceType: Ord-Bound   Profile: ieee1588   2StepFlag: False
  ClockId: ca:69:dd:ff:fe:e9:bb:b9
  Quality: Cl:248 Ac:Unknwn Va:65535   Pri1:128 Pri2:128

show ptp 0 virtual-port
  io-pin: 2   enable: TRUE   PTP-State: slve
  class: 6   accuracy: 100 ns   variance: 65535
  clock-identity: ca:69:dd:ff:fe:e9:bb:bd

show ptp 0 parent
  Parent / GM: ca:69:dd:ff:fe:e9:bb:bd  (= virtual port)
  GM quality: Cl:006 Ac:100 ns Va:65535

show ptp 0 current
  stpRm: 1   OffsetFromMaster: 171 ps   MeanPathDelay: 0

show ptp 0 port-state  (active ports only)
  Port  4: mstr (Up)   <- distributing time to DUT2
  Port 58: slve (VP)   <- locked to GNSS virtual port
```

DUT1 is correctly locked to the GNSS-referenced virtual port: the 171 ps offset is effectively zero at this measurement scale. Its boundary-clock port is up and acting as a master, so it is re-originating PTP time for the downstream device with the GNSS grandmaster quality (class 6, 100 ns accuracy).

### 6.2 EVB-LAN9668 (DUT2)

```{ .text .no-copy }
show ptp 0 current
  stpRm: 2   OffsetFromMaster: 3.397 ns   MeanPathDelay: 8.611 ns

show ptp 0 parent
  Parent: ca:69:dd:ff:fe:e9:bb:b9 port 4  (= DUT1 Gi 1/4)
  GM:     ca:69:dd:ff:fe:e9:bb:bd  Cl:006 Ac:100 ns  (= DUT1 virtual port / GNSS)

show ptp 0 port-state
  Port 2: slve (Up)   <- locked to DUT1

show ptp 0 slave
  Slave port: 2   Slave state: PHASE_LOCKED   Holdover: N/A
```

DUT2 has successfully selected DUT1 as its parent and is phase-locked. The `stpRm` value of 2 reflects the two clock steps from the GNSS virtual port through DUT1 to DUT2. The approximately 3.4 ns offset and 8.6 ns mean path delay are consistent with a direct cable and one-step hardware timestamping, demonstrating accurate time transfer across the boundary-clock hop.

---

## 7 Notes

**Boundary clock vs transparent clock:**
A boundary clock terminates PTP on each port, it acts as both slave (toward the grandmaster) and master (toward downstream slaves), re-originating timestamps at each hop. A transparent clock instead forwards PTP frames and only corrects for residence time. The BC topology here allows each downstream device to run its own servo and recover independently; a TC chain would give lower jitter but all slaves share a single servo path.

**Virtual port as grandmaster:**
DUT1's virtual port (io-pin 2) receives the GNSS 1PPS and becomes a separate clock identity (`bb:bd`) with class 6, accuracy 100 ns, advertising GNSS-quality time via BMCA. The BC instance (`bb:b9`) slaves itself to that virtual port (`stpRm=1`, offset ~171 ps) and then acts as master on all Ethernet ports.

**Interval encoding:**

| Value | Period | Rate |
|---|---|---|
| -4 | 1/16 s | 16 msg/s |
| -3 | 1/8 s | 8 msg/s |
| 0 | 1 s | 1 msg/s |
| 1 | 2 s | 0.5 msg/s |

`sync-interval -4` = 16 Sync messages per second. `announce interval 1` = one Announce every 2 seconds.

**One-step timestamping:**
Hardware timestamps are inserted in-frame by the LAN8814 PHY TSU (ports 1–48) and by the VSC47558 switch core (ports 49+). No Follow_Up message is generated. Changing to `twostep` forces software timestamping and degrades accuracy.

**GNSS ToD and 1PPS:**
The GNSS virtual port is fed by `$GNRMC` serial ToD and a hardware 1PPS. The RMC sentence must carry status `A` (active fix) for ToD to be accepted. If `System Time` in `show version` still shows the image build date, the GNSS has no fix, the servo may still run on 1PPS phase alone, but absolute time will be wrong.
