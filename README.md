<a id="top"></a>

<div align="center">

# deck-kit

<img src="./assets/banner.png" alt="deck kit — beautiful HTML slide templates" />

**34 mẫu slide HTML thiết kế sẵn, kèm công cụ trình chiếu, dùng để làm bài thuyết trình cùng coding agent.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://github.com/awun0105/deck-kit/actions/workflows/test.yml/badge.svg)](https://github.com/awun0105/deck-kit/actions/workflows/test.yml)

[English: README.en.md](README.en.md)

</div>

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Ảnh chụp màn hình](#ảnh-chụp-màn-hình)
- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc kho mã nguồn](#cấu-trúc-kho-mã-nguồn)
- [Hướng dẫn bắt đầu](#hướng-dẫn-bắt-đầu)
- [Sử dụng nâng cao](#sử-dụng-nâng-cao)
- [Đóng góp](#đóng-góp)
- [Lời cảm ơn](#lời-cảm-ơn)
- [Bản quyền](#bản-quyền)

---

## Tổng quan

deck-kit giúp làm bài thuyết trình bằng HTML cùng coding agent như Claude Code, Codex hay Gemini CLI. Chỉ cần mô tả bài nói: agent chọn một trong 34 mẫu, viết nội dung và ghi chú người nói, rồi trả về một file HTML. File mở bằng trình duyệt là trình chiếu được, không cần PowerPoint hay mạng.

## Ảnh chụp màn hình

<p>
  <img src="./screenshots/soft-editorial-4.png" width="32.5%" alt="Soft Editorial" />
  <img src="./screenshots/vellum-1.png" width="32.5%" alt="Vellum" />
  <img src="./screenshots/creative-mode-1.png" width="32.5%" alt="Creative Mode" />
  <img src="./screenshots/8-bit-orbit-1.png" width="32.5%" alt="8-Bit Orbit" />
  <img src="./screenshots/emerald-editorial-1.png" width="32.5%" alt="Emerald Editorial" />
  <img src="./screenshots/daisy-days-1.png" width="32.5%" alt="Daisy Days" />
</p>

<details>
<summary><b>Xem cả 34 mẫu</b></summary>

34 mẫu, mỗi mẫu 3 slide minh hoạ (bìa · giữa bài · cuối bài). Bấm vào tên mẫu để mở thư mục của mẫu đó.

### [Soft Editorial](./templates/soft-editorial/)

<p>
  <img src="./screenshots/soft-editorial-4.png" width="32.5%" alt="Soft Editorial — slide 4" />
  <img src="./screenshots/soft-editorial-6.png" width="32.5%" alt="Soft Editorial — slide 6" />
  <img src="./screenshots/soft-editorial-10.png" width="32.5%" alt="Soft Editorial — slide 10" />
</p>

> Chữ serif Cormorant Garamond trên nền giấy ấm, điểm thêm xanh sage, hồng phấn và vàng chanh.

### [Editorial Forest](./templates/editorial-forest/)

<p>
  <img src="./screenshots/editorial-forest-1.png" width="32.5%" alt="Editorial Forest — slide 1" />
  <img src="./screenshots/editorial-forest-2.png" width="32.5%" alt="Editorial Forest — slide 2" />
  <img src="./screenshots/editorial-forest-5.png" width="32.5%" alt="Editorial Forest — slide 5" />
</p>

> Xanh rừng, hồng phai và kem ấm với font Source Serif 4 — trầm, chỉn chu, hợp báo cáo quý.

### [Pin & Paper](./templates/pin-and-paper/)

<p>
  <img src="./screenshots/pin-and-paper-1.png" width="32.5%" alt="Pin & Paper — slide 1" />
  <img src="./screenshots/pin-and-paper-11.png" width="32.5%" alt="Pin & Paper — slide 11" />
  <img src="./screenshots/pin-and-paper-3.png" width="32.5%" alt="Pin & Paper — slide 3" />
</p>

> Giấy vàng có hình kim băng, chữ viết tay Caveat màu mực xanh, vân giấy thật.

### [Sakura Chroma](./templates/sakura-chroma/)

<p>
  <img src="./screenshots/sakura-chroma-1.png" width="32.5%" alt="Sakura Chroma — slide 1" />
  <img src="./screenshots/sakura-chroma-3.png" width="32.5%" alt="Sakura Chroma — slide 3" />
  <img src="./screenshots/sakura-chroma-4.png" width="32.5%" alt="Sakura Chroma — slide 4" />
</p>

> Phong cách vỏ băng cassette Nhật cổ: giấy kem, dải cầu vồng chéo, chữ đậm hẹp.

### [Stencil & Tablet](./templates/stencil-tablet/)

<p>
  <img src="./screenshots/stencil-tablet-1.png" width="32.5%" alt="Stencil & Tablet — slide 1" />
  <img src="./screenshots/stencil-tablet-3.png" width="32.5%" alt="Stencil & Tablet — slide 3" />
  <img src="./screenshots/stencil-tablet-8.png" width="32.5%" alt="Stencil & Tablet — slide 8" />
</p>

> Giấy màu xương với tiêu đề kiểu khuôn chữ và bảng 6 màu đất — khảo cổ gặp thương hiệu.

### [Cobalt Grid](./templates/cobalt-grid/)

<p>
  <img src="./screenshots/cobalt-grid-1.png" width="32.5%" alt="Cobalt Grid — slide 1" />
  <img src="./screenshots/cobalt-grid-3.png" width="32.5%" alt="Cobalt Grid — slide 3" />
  <img src="./screenshots/cobalt-grid-5.png" width="32.5%" alt="Cobalt Grid — slide 5" />
</p>

> Chữ serif nghiêng xanh cobalt trên nền giấy kẻ ô, điểm hoạ tiết pixel bậc thang.

### [Vellum](./templates/vellum/)

<p>
  <img src="./screenshots/vellum-1.png" width="32.5%" alt="Vellum — slide 1" />
  <img src="./screenshots/vellum-4.png" width="32.5%" alt="Vellum — slide 4" />
  <img src="./screenshots/vellum-8.png" width="32.5%" alt="Vellum — slide 8" />
</p>

> Nền xanh navy đậm, chữ serif nghiêng vàng ấm và một màu nhấn xanh ngọc — học thuật, tĩnh lặng.

### [Emerald Editorial](./templates/emerald-editorial/)

<p>
  <img src="./screenshots/emerald-editorial-1.png" width="32.5%" alt="Emerald Editorial — slide 1" />
  <img src="./screenshots/emerald-editorial-3.png" width="32.5%" alt="Emerald Editorial — slide 3" />
  <img src="./screenshots/emerald-editorial-6.png" width="32.5%" alt="Emerald Editorial — slide 6" />
</p>

> Deck kinh doanh kiểu bìa tạp chí: xanh ngọc lục, navy và giấy, có đường viền đôi.

### [Neo-Grid Bold](./templates/neo-grid-bold/)

<p>
  <img src="./screenshots/neo-grid-bold-1.png" width="32.5%" alt="Neo-Grid Bold — slide 1" />
  <img src="./screenshots/neo-grid-bold-3.png" width="32.5%" alt="Neo-Grid Bold — slide 3" />
  <img src="./screenshots/neo-grid-bold-8.png" width="32.5%" alt="Neo-Grid Bold — slide 8" />
</p>

> Phong cách neo-brutalism biên tập, chỉ một màu nhấn vàng neon trên giấy trắng ngà.

### [Editorial Tri-Tone](./templates/editorial-tri-tone/)

<p>
  <img src="./screenshots/editorial-tri-tone-1.png" width="32.5%" alt="Editorial Tri-Tone — slide 1" />
  <img src="./screenshots/editorial-tri-tone-4.png" width="32.5%" alt="Editorial Tri-Tone — slide 4" />
  <img src="./screenshots/editorial-tri-tone-3.png" width="32.5%" alt="Editorial Tri-Tone — slide 3" />
</p>

> Ba màu biên tập: hồng phai, kem mù tạt và đỏ burgundy, font Bricolage + Instrument Serif.

### [Creative Mode](./templates/creative-mode/)

<p>
  <img src="./screenshots/creative-mode-1.png" width="32.5%" alt="Creative Mode — slide 1" />
  <img src="./screenshots/creative-mode-4.png" width="32.5%" alt="Creative Mode — slide 4" />
  <img src="./screenshots/creative-mode-6.png" width="32.5%" alt="Creative Mode — slide 6" />
</p>

> Nền giấy kem với các mảng màu tự tin (xanh lá, hồng, cam, vàng) và tiêu đề Archivo Black.

### [Monochrome](./templates/monochrome/)

<p>
  <img src="./screenshots/monochrome-1.png" width="32.5%" alt="Monochrome — slide 1" />
  <img src="./screenshots/monochrome-4.png" width="32.5%" alt="Monochrome — slide 4" />
  <img src="./screenshots/monochrome-12.png" width="32.5%" alt="Monochrome — slide 12" />
</p>

> Giấy ngà như sổ cái, chữ đen hoàn toàn; tiêu đề Lora, thân bài Jost, không một chút màu.

### [People's Platform (Block & Bold)](./templates/peoples-platform/)

<p>
  <img src="./screenshots/peoples-platform-1.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 1" />
  <img src="./screenshots/peoples-platform-4.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 4" />
  <img src="./screenshots/peoples-platform-8.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 8" />
</p>

> Năng lượng áp phích cổ động: xanh, cam, đỏ trên nền kem, font Alfa Slab + Caveat Brush.

### [Pink Script — After Hours](./templates/pink-script/)

<p>
  <img src="./screenshots/pink-script-1.png" width="32.5%" alt="Pink Script — After Hours — slide 1" />
  <img src="./screenshots/pink-script-4.png" width="32.5%" alt="Pink Script — After Hours — slide 4" />
  <img src="./screenshots/pink-script-8.png" width="32.5%" alt="Pink Script — After Hours — slide 8" />
</p>

> Nền đen, hồng nóng, giấy kem ngọc trai, tiêu đề Instrument Serif — sang trọng kiểu đêm khuya.

### [8-Bit Orbit](./templates/8-bit-orbit/)

<p>
  <img src="./screenshots/8-bit-orbit-1.png" width="32.5%" alt="8-Bit Orbit — slide 1" />
  <img src="./screenshots/8-bit-orbit-6.png" width="32.5%" alt="8-Bit Orbit — slide 6" />
  <img src="./screenshots/8-bit-orbit-5.png" width="32.5%" alt="8-Bit Orbit — slide 5" />
</p>

> Pixel art neon kiểu máy chơi game trên nền xanh navy sâu thẳm.

### [BlockFrame](./templates/block-frame/)

<p>
  <img src="./screenshots/block-frame-1.png" width="32.5%" alt="BlockFrame — slide 1" />
  <img src="./screenshots/block-frame-4.png" width="32.5%" alt="BlockFrame — slide 4" />
  <img src="./screenshots/block-frame-8.png" width="32.5%" alt="BlockFrame — slide 8" />
</p>

> Neo-brutalism với các khối màu pastel-neon và viền đen dày.

### [Blue Professional](./templates/blue-professional/)

<p>
  <img src="./screenshots/blue-professional-1.png" width="32.5%" alt="Blue Professional — slide 1" />
  <img src="./screenshots/blue-professional-6.png" width="32.5%" alt="Blue Professional — slide 6" />
  <img src="./screenshots/blue-professional-8.png" width="32.5%" alt="Blue Professional — slide 8" />
</p>

> Nền kem với điểm nhấn xanh cobalt; hiện đại, gọn gàng, chuyên nghiệp.

### [Bold Poster](./templates/bold-poster/)

<p>
  <img src="./screenshots/bold-poster-1.png" width="32.5%" alt="Bold Poster — slide 1" />
  <img src="./screenshots/bold-poster-4.png" width="32.5%" alt="Bold Poster — slide 4" />
  <img src="./screenshots/bold-poster-8.png" width="32.5%" alt="Bold Poster — slide 8" />
</p>

> Áp phích biên tập với chữ Shrikhand khổng lồ và một màu đỏ xe cứu hoả.

### [Broadside](./templates/broadside/)

<p>
  <img src="./screenshots/broadside-1.png" width="32.5%" alt="Broadside — slide 1" />
  <img src="./screenshots/broadside-4.png" width="32.5%" alt="Broadside — slide 4" />
  <img src="./screenshots/broadside-13.png" width="32.5%" alt="Broadside — slide 13" />
</p>

> Nền tối kiểu báo, một màu cam lửa, hỗ trợ cả chữ Latin lẫn chữ Hán.

### [Capsule](./templates/capsule/)

<p>
  <img src="./screenshots/capsule-1.png" width="32.5%" alt="Capsule — slide 1" />
  <img src="./screenshots/capsule-4.png" width="32.5%" alt="Capsule — slide 4" />
  <img src="./screenshots/capsule-8.png" width="32.5%" alt="Capsule — slide 8" />
</p>

> Thẻ bo tròn hình viên thuốc trên nền xương ấm, bảng màu pastel tươi.

### [Cartesian](./templates/cartesian/)

<p>
  <img src="./screenshots/cartesian-1.png" width="32.5%" alt="Cartesian — slide 1" />
  <img src="./screenshots/cartesian-4.png" width="32.5%" alt="Cartesian — slide 4" />
  <img src="./screenshots/cartesian-8.png" width="32.5%" alt="Cartesian — slide 8" />
</p>

> Bảng màu trung tính ấm, chữ serif Playfair cổ điển; nhã nhặn, thong thả.

### [Coral](./templates/coral/)

<p>
  <img src="./screenshots/coral-1.png" width="32.5%" alt="Coral — slide 1" />
  <img src="./screenshots/coral-4.png" width="32.5%" alt="Coral — slide 4" />
  <img src="./screenshots/coral-8.png" width="32.5%" alt="Coral — slide 8" />
</p>

> Kem và san hô trên nền gần đen, chữ Bebas Neue cỡ lớn.

### [Daisy Days](./templates/daisy-days/)

<p>
  <img src="./screenshots/daisy-days-1.png" width="32.5%" alt="Daisy Days — slide 1" />
  <img src="./screenshots/daisy-days-4.png" width="32.5%" alt="Daisy Days — slide 4" />
  <img src="./screenshots/daisy-days-8.png" width="32.5%" alt="Daisy Days — slide 8" />
</p>

> Pastel vui tươi với hoa cúc, ngôi sao, cầu vồng vẽ tay. Thân thiện, mềm mại, ấm áp.

### [Grove](./templates/grove/)

<p>
  <img src="./screenshots/grove-1.png" width="32.5%" alt="Grove — slide 1" />
  <img src="./screenshots/grove-4.png" width="32.5%" alt="Grove — slide 4" />
  <img src="./screenshots/grove-8.png" width="32.5%" alt="Grove — slide 8" />
</p>

> Nền xanh rừng, chữ kem, serif Playfair cổ điển và một màu nhấn gỉ sắt.

### [Mat](./templates/mat/)

<p>
  <img src="./screenshots/mat-1.png" width="32.5%" alt="Mat — slide 1" />
  <img src="./screenshots/mat-4.png" width="32.5%" alt="Mat — slide 4" />
  <img src="./screenshots/mat-8.png" width="32.5%" alt="Mat — slide 8" />
</p>

> Nền xanh sage tối, giấy màu xương, nhấn cam cháy; phong cách mid-century có chút vân gỗ.

### [Playful](./templates/playful/)

<p>
  <img src="./screenshots/playful-1.png" width="32.5%" alt="Playful — slide 1" />
  <img src="./screenshots/playful-6.png" width="32.5%" alt="Playful — slide 6" />
  <img src="./screenshots/playful-8.png" width="32.5%" alt="Playful — slide 8" />
</p>

> Nền cam đào ấm nắng với tiêu đề Syne: deck ra mắt sản phẩm nhỏ thân thiện.

### [Raw Grid](./templates/raw-grid/)

<p>
  <img src="./screenshots/raw-grid-1.png" width="32.5%" alt="Raw Grid — slide 1" />
  <img src="./screenshots/raw-grid-4.png" width="32.5%" alt="Raw Grid — slide 4" />
  <img src="./screenshots/raw-grid-8.png" width="32.5%" alt="Raw Grid — slide 8" />
</p>

> Neo-brutalism với viền dày, bóng đổ lệch và bảng màu hồng/sage/mực.

### [Retro Windows](./templates/retro-windows/)

<p>
  <img src="./screenshots/retro-windows-1.png" width="32.5%" alt="Retro Windows — slide 1" />
  <img src="./screenshots/retro-windows-4.png" width="32.5%" alt="Retro Windows — slide 4" />
  <img src="./screenshots/retro-windows-8.png" width="32.5%" alt="Retro Windows — slide 8" />
</p>

> Giao diện Windows 95: thanh tiêu đề xám, font MS Sans Serif, chữ pixel, hoài niệm trọn vẹn.

### [Retro Zine](./templates/retro-zine/)

<p>
  <img src="./screenshots/retro-zine-1.png" width="32.5%" alt="Retro Zine — slide 1" />
  <img src="./screenshots/retro-zine-4.png" width="32.5%" alt="Retro Zine — slide 4" />
  <img src="./screenshots/retro-zine-8.png" width="32.5%" alt="Retro Zine — slide 8" />
</p>

> Giấy be với màu nhấn xanh lá, Bebas Neue + Caveat: một tạp chí in riso dạng HTML.

### [Scatterbrain](./templates/scatterbrain/)

<p>
  <img src="./screenshots/scatterbrain-1.png" width="32.5%" alt="Scatterbrain — slide 1" />
  <img src="./screenshots/scatterbrain-4.png" width="32.5%" alt="Scatterbrain — slide 4" />
  <img src="./screenshots/scatterbrain-8.png" width="32.5%" alt="Scatterbrain — slide 8" />
</p>

> Lấy cảm hứng từ giấy note: giấy dán pastel, chữ viết tay Caveat, Shrikhand và Zilla Slab.

### [Signal](./templates/signal/)

<p>
  <img src="./screenshots/signal-1.png" width="32.5%" alt="Signal — slide 1" />
  <img src="./screenshots/signal-18.png" width="32.5%" alt="Signal — slide 18" />
  <img src="./screenshots/signal-8.png" width="32.5%" alt="Signal — slide 8" />
</p>

> Nền xanh navy, giấy màu xương và một màu vàng nhạt; nghiêm túc, có sức nặng mà không ồn ào.

### [Studio](./templates/studio/)

<p>
  <img src="./screenshots/studio-1.png" width="32.5%" alt="Studio — slide 1" />
  <img src="./screenshots/studio-4.png" width="32.5%" alt="Studio — slide 4" />
  <img src="./screenshots/studio-8.png" width="32.5%" alt="Studio — slide 8" />
</p>

> Nền đen với chữ vàng điện; phong cách studio thiết kế đầy năng lượng.

### [Biennale Yellow](./templates/biennale-yellow/)

<p>
  <img src="./screenshots/biennale-yellow-1.png" width="32.5%" alt="Biennale Yellow — slide 1" />
  <img src="./screenshots/biennale-yellow-5.png" width="32.5%" alt="Biennale Yellow — slide 5" />
  <img src="./screenshots/biennale-yellow-8.png" width="32.5%" alt="Biennale Yellow — slide 8" />
</p>

> Vàng nắng trên giấy da ấm, serif chàm đậm và quầng sáng mặt trời — biên tập kiểu Hà Lan.

### [Long Table](./templates/long-table/)

<p>
  <img src="./screenshots/long-table-1.png" width="32.5%" alt="Long Table — slide 1" />
  <img src="./screenshots/long-table-3.png" width="32.5%" alt="Long Table — slide 3" />
  <img src="./screenshots/long-table-7.png" width="32.5%" alt="Long Table — slide 7" />
</p>

> Kem ấm và đỏ gỉ kiểu câu lạc bộ ẩm thực, tiêu đề in hoa đậm và chữ nghiêng Fraunces.

</details>

## Tính năng chính

- **Trình chiếu:** màn hình người trình bày trên laptop (slide kế tiếp, ghi chú, đồng hồ), con trỏ laser, vẽ lên slide, phóng to một vùng.
- **Slide tương tác:** hiện từng bước, công thức toán, code tô màu, câu hỏi trắc nghiệm, biểu đồ, video; mỗi thứ chỉ cần một thuộc tính HTML.
- **Sửa ngay trên trình duyệt:** kéo, đổi cỡ, gõ lại chữ rồi lưu thẳng vào file.
- **Nhập và xuất:** từ Markdown hoặc PowerPoint sang deck; từ deck sang PDF, PowerPoint hoặc một link chia sẻ.

## Cấu trúc kho mã nguồn

| Đường dẫn | Mô tả |
|---|---|
| `templates/` | 34 mẫu, mỗi mẫu một thư mục chạy độc lập |
| `runtime/` | Bộ điều khiển trình chiếu `deck-kit.js`, dùng chung cho mọi mẫu |
| `scripts/` | Lệnh tạo deck, nhập, kiểm tra, xuất file và đưa lên mạng |
| `examples/deck-kit-demo/` | Deck trình diễn mọi tính năng |
| `AGENTS.md` | Hướng dẫn đầy đủ cho agent (cũng là `SKILL.md`) |

## Hướng dẫn bắt đầu

Cần Node.js 18 trở lên và Google Chrome (Chrome dùng để kiểm tra và xuất file; chỉ trình chiếu thì trình duyệt nào cũng được).

### 1. Cài đặt

Với Claude Code, cài dạng plugin:

```text
/plugin marketplace add awun0105/deck-kit
/plugin install deck-kit@deck-kit
```

Với agent khác, tải mã nguồn về rồi mở agent trong thư mục `deck-kit` (agent tự đọc `AGENTS.md`):

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit && npm install
```

Mở `examples/deck-kit-demo/index.html` để xem thử deck-kit làm được gì.

### 2. Làm một bộ slide

Nhắn cho agent, ví dụ:

> Dùng deck-kit làm bộ slide 20 phút về bộ lọc Kalman để trình bày trên lớp.

Agent hỏi vài câu, cho xem trước ba mẫu, rồi làm bộ slide hoàn chỉnh. Muốn tự làm thì dùng các lệnh sau (tên mẫu là tên thư mục trong `templates/`):

```bash
node scripts/new-deck.mjs vellum ~/slides/kalman      # từ một mẫu
node scripts/md-to-deck.mjs dan-y.md --theme=vellum   # từ Markdown
node scripts/pptx-to-deck.mjs bai.pptx --theme=vellum # từ PowerPoint
```

### 3. Trình chiếu

Mở `index.html` của deck bằng trình duyệt. Các phím hay dùng:

| Phím | Tác dụng |
|---|---|
| `←` `→` | Chuyển slide, hiện từng phần |
| `P` | Màn hình người trình bày (cửa sổ thứ hai) |
| `N` / `T` | Ghi chú / đồng hồ |
| `L` / `D` / `Z` | Laser / vẽ / phóng to |
| `E` | Sửa trực tiếp, bấm lần nữa để lưu |
| `?` | Xem mọi phím tắt |

## Sử dụng nâng cao

- **Slide tương tác:** danh sách thuộc tính kèm ví dụ nằm trong [widgets-reference.md](widgets-reference.md). Thường chỉ cần nói với agent, ví dụ "thêm câu hỏi trắc nghiệm cuối phần 2".
- **Nhờ agent sửa đúng chỗ:** bấm `K`, click vào phần tử cần sửa để chép vị trí, rồi dán vào chat kèm yêu cầu.
- **Xuất file và chia sẻ:** bấm `X` trong deck để in PDF hoặc lấy sẵn lệnh, hoặc chạy trực tiếp:

  ```bash
  node scripts/export.mjs ~/slides/kalman/index.html --pdf --pptx
  node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel   # hoặc cloudflare, github
  ```

  Deck đưa lên mạng là công khai; ghi chú người nói được loại khỏi bản đăng.

Các lệnh và tùy chọn khác được mô tả trong [AGENTS.md](AGENTS.md), mục 8 và 9.

## Đóng góp

Báo lỗi và góp ý qua [GitHub Issues](https://github.com/awun0105/deck-kit/issues). Khi gửi pull request, chỉ sửa runtime trong `runtime/`, chạy `npm run sync` rồi `npm test`.

## Lời cảm ơn

deck-kit phát triển từ [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) của Zara Zhang (MIT; 34 mẫu thiết kế là của dự án gốc), cùng các ý tưởng từ [frontend-slides](https://github.com/zarazhangrui/frontend-slides) (MIT) và [ai-deck-builder](https://github.com/Faris-Alanazi/ai-deck-builder) (MIT).

## Bản quyền

Dự án dùng giấy phép MIT; xem file [LICENSE](LICENSE).

---

<div align="center">

[Về đầu trang](#top)

</div>
