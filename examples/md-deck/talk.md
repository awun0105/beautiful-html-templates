---
title: Bộ lọc Kalman trong 10 phút
lang: vi
author: Ví dụ md-to-deck
theme: vellum
---
# Bộ lọc Kalman trong 10 phút
Kết hợp mô hình và cảm biến nhiễu một cách tối ưu

Note: Chào mọi người. Đây là ví dụ viết bằng Markdown; mỗi slide cách nhau bằng dòng ---.

---
<!-- sec: Vì sao cần lọc | min: 2 -->
## Cảm biến không bao giờ chính xác
- GPS lệch vài mét, nhảy khi vào hầm
- Mô hình chuyển động thì **trôi** dần theo thời gian
- Cần một cách trộn hai nguồn có trọng số
  - tin cái nào nhiều hơn?
  - và tin bao nhiêu?

Note: Hỏi lớp: ai từng thấy chấm xanh trên bản đồ nhảy sang đường bên cạnh?

---
# Ý tưởng chính
Trung bình có trọng số theo độ tin cậy

---
<!-- min: 2 -->
## Dự đoán và cập nhật
**Dự đoán**
- dịch theo mô hình chuyển động
- độ bất định tăng (cộng Q)
|||
**Cập nhật**
- so với phép đo của cảm biến
- độ bất định giảm (nhờ R)

Note: Nhấn mạnh nhịp tăng rồi giảm của độ bất định.

---
<!-- layout: stats | min: 1 -->
## Con số đáng nhớ
- **2** con số là đủ: trung bình và phương sai
- **0–1** khoảng giá trị của hệ số K
- **1960** năm Kalman công bố

---
<!-- min: 2 -->
## Năm dòng code
```python
x_pred = x + u               # dự đoán
P_pred = P + Q
K = P_pred / (P_pred + R)     # hệ số Kalman
x = x_pred + K * (z - x_pred) # cập nhật
P = (1 - K) * P_pred
```

---
## So sánh nhanh
| Bộ lọc | Phi tuyến | Chi phí |
|---|---|---|
| KF | không | rất thấp |
| EKF | đạo hàm | thấp |
| UKF | điểm sigma | vừa |
| Hạt | mẫu | cao |

---
> Mọi mô hình đều sai, nhưng một số mô hình hữu ích.
— George Box

---
# Cảm ơn!
Câu hỏi?
