# G.8273.2 Telecom PTP Performance Demo

## 1 Objective

G.8273.2 is a **performance standard** that defines the maximum time error a
Telecom Boundary Clock (T-BC) or Telecom Time Slave Clock (T-TSC) is allowed to
produce. It does **not** define a PTP profile or protocol configuration.

To test for compliance: run a standard telecom PTP profile and measure the offset.

### 1.1 Accuracy classes

| Class | Max time error (cTE) |
| ----- | -------------------- |
| A     | ≤ 100 ns             |
| B     | ≤ 40 ns              |
| C     | ≤ 30 ns              |
| D     | ≤ 5 ns               |

Class D is the strictest and applies to enhanced PRTC (ePRTC) scenarios.

---

## 2 Test Topology

![Timing Sync-E Block Diagram](assets/timing-synce-demo-block-diagram.png)

The test topology is GNSS to DUT1 (PCB135/VSC7558), then DUT3 (EVB-LAN969x 24-Cu). DUT1 provides the telecom PTP reference and DUT3 is measured as the telecom time slave.

## 3 Configure a telecom PTP profile

Use **G.8275.1** (Ethernet multicast) or **G.8275.2** (IPv4 unicast).
See:

1. [G.8275.1 PTP Boundary Clock with SyncE Hybrid Mode](timing-ptp-packet-synce-hybrid-mode-(nco-assisted)-g.8275.1-demo.md)
2. [G.8275.2 PTP Boundary Clock with SyncE Hybrid Mode](timing-ptp-packet-synce-hybrid-mode-(nco-assisted)-g8275.2-demo.md)

for verified configurations.

## 4 Wait for PHASE_LOCKED

```console
# show ptp 0 slave
```

Wait until slave state is `PHASE_LOCKED` before recording measurements.

## 5 Read OffsetFromMaster

```console
# show ptp 0 current
```

The `OffsetFromMaster` field is the time error. Compare against the target class.

---

## 6 Results

**Topology**: GNSS → DUT1 (PCB135/VSC7558) → DUT3 (EVB-LAN969x 24-Cu)
**Profile**: G.8275.2 with SyncE hybrid mode

```{ .text .no-copy }
OffsetFromMaster: -0.000,000,000,541   (-541 ps)
```

**Result: passes Class D (≤ 5 ns)**
