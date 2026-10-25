<a id="top"></a>

<div align="center">

# deck-kit

<img src="./assets/banner.png" alt="deck kit — beautiful HTML slide templates" />

**34 mẫu slide HTML thiết kế sẵn, kèm công cụ trình chiếu, dùng để làm bài thuyết trình cùng coding agent.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://github.com/awun0105/deck-kit/actions/workflows/test.yml/badge.svg)](https://github.com/awun0105/deck-kit/actions/workflows/test.yml)

[English: README.en.md](README.en.md)

</div>

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Ảnh chụp màn hình](#ảnh-chụp-màn-hình)
- [Tính năng chính](#tính-năng-chính)
- [Thành phần phần mềm](#thành-phần-phần-mềm)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc kho mã nguồn](#cấu-trúc-kho-mã-nguồn)
- [Đối tượng mục tiêu / Trường hợp sử dụng](#đối-tượng-mục-tiêu--trường-hợp-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn bắt đầu](#hướng-dẫn-bắt-đầu)
- [Tùy chỉnh & Sử dụng nâng cao](#tùy-chỉnh--sử-dụng-nâng-cao)
- [Tài liệu hướng dẫn](#tài-liệu-hướng-dẫn)
- [Đóng góp](#đóng-góp)
- [Cân nhắc bảo mật](#cân-nhắc-bảo-mật)
- [Lời cảm ơn](#lời-cảm-ơn)
- [Liên hệ](#liên-hệ)
- [Bản quyền](#bản-quyền)

---

## Tổng quan

deck-kit là bộ mẫu slide HTML và công cụ đi kèm để làm bài thuyết trình cùng coding agent như Claude Code, Codex hay Gemini CLI. Agent hỏi về dịp trình bày và cảm giác mong muốn, chọn một trong 34 mẫu, viết nội dung slide và ghi chú người nói, rồi trả về một file HTML duy nhất. File này mở được bằng mọi trình duyệt và chạy không cần mạng, không cần PowerPoint hay tài khoản nào.

Mẫu nào cũng gắn sẵn cùng một bộ điều khiển trình chiếu là `deck-kit.js`. Bộ điều khiển này thêm màn hình người trình bày trên máy thứ hai, ghi chú người nói, đồng hồ, bút vẽ và con trỏ laser, chế độ sửa trực tiếp lưu vào file, cùng các slide tương tác như hiện từng bước, công thức toán, câu hỏi trắc nghiệm và biểu đồ. Các script Node.js chuyển Markdown hoặc PowerPoint có sẵn thành deck, kiểm tra lỗi, xuất PDF, PNG, PowerPoint và đưa deck lên mạng để có link chia sẻ.

## Ảnh chụp màn hình

Sáu trong số 34 mẫu (slide bìa):

<p>
  <img src="./screenshots/soft-editorial-4.png" width="32.5%" alt="Soft Editorial" />
  <img src="./screenshots/vellum-1.png" width="32.5%" alt="Vellum" />
  <img src="./screenshots/creative-mode-1.png" width="32.5%" alt="Creative Mode" />
  <img src="./screenshots/8-bit-orbit-1.png" width="32.5%" alt="8-Bit Orbit" />
  <img src="./screenshots/emerald-editorial-1.png" width="32.5%" alt="Emerald Editorial" />
  <img src="./screenshots/daisy-days-1.png" width="32.5%" alt="Daisy Days" />
</p>

<details>
<summary><b>Xem cả 34 mẫu</b> (mỗi mẫu 3 slide)</summary>

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

- **34 mẫu slide:** mỗi mẫu một phong cách riêng (tạp chí, tối giản, áp phích, retro, pastel, pixel art…) và nằm gọn trong một thư mục, chạy độc lập.
- **Màn hình người trình bày:** laptop hiện slide hiện tại, slide kế tiếp, ghi chú, đồng hồ và kế hoạch thời gian, trong khi máy chiếu chỉ hiện slide; thao tác trên một màn hình tự đồng bộ sang màn hình kia.
- **Công cụ đứng lớp:** tắt màn hình đen hoặc trắng, con trỏ laser, vẽ lên slide, phóng to một vùng, menu slide có phút dự kiến, đồng hồ đếm ngược.
- **Slide tương tác:** hiện từng bước, công thức toán KaTeX, code tô màu và làm nổi từng dòng, câu hỏi trắc nghiệm, biểu đồ cột / đường / tròn, mô phỏng có nút phát và dừng, thanh kéo so sánh trước và sau, chấm chú thích trên ảnh, mã QR, biểu đồ động trên canvas.
- **Video và âm thanh:** có sẵn nút điều khiển; không tự phát; chuyển sang slide khác thì tự dừng và quay về đầu.
- **Sửa ngay trên trình duyệt:** kéo, đổi cỡ, gõ lại chữ rồi lưu thẳng vào file HTML; hoặc chép vị trí chính xác của một phần tử để gửi agent sửa.
- **Nhập và xuất:** từ Markdown hoặc PowerPoint sang deck; từ deck sang PDF, PNG, bản phát tay, PowerPoint (dạng ảnh hoặc sửa được chữ) hay một file HTML chạy offline.
- **Đưa lên mạng:** một lệnh để đăng lên Vercel, Cloudflare Pages hoặc GitHub Pages; ghi chú người nói mặc định không được đăng kèm.
- **Hướng dẫn cho agent:** `AGENTS.md` và `SKILL.md` chỉ cho agent cách chọn mẫu, giữ đúng thiết kế và dùng mọi tính năng.

## Thành phần phần mềm

- **Slide:** HTML và CSS thuần cho từng mẫu; web component `<deck-stage>` (`deck-stage.js`) lo bố cục và chuyển slide.
- **Bộ điều khiển trình chiếu:** `deck-kit.js`, JavaScript thuần không phụ thuộc thư viện nào, dùng chung cho mọi mẫu.
- **Thư viện tải khi cần:** KaTeX (công thức toán) và qrcode-generator (mã QR) từ CDN jsDelivr; `bundle.mjs` nhúng sẵn hai thư viện này vào file offline.
- **Công cụ:** script Node.js dùng `puppeteer-core` (Chrome chạy ngầm), `pptxgenjs` (tạo PowerPoint) và `jszip` (đọc PowerPoint).
- **Đưa lên mạng:** Vercel CLI, Wrangler (Cloudflare) hoặc GitHub CLI, gọi qua `npx` và `gh`.

## Kiến trúc hệ thống

Mỗi deck là một file HTML tải hai script:

1. **HTML và CSS của mẫu** tạo ra nội dung và giao diện slide.
2. **`deck-stage.js`** (hoặc đoạn điều hướng riêng của mẫu) sắp xếp và chuyển slide.
3. **`deck-kit.js`** tìm các slide, thêm công cụ trình chiếu và tính năng tương tác, đồng thời trao đổi với cửa sổ người trình bày qua `postMessage`.
4. **Các script trong `scripts/`** mở chính file đó bằng Chrome chạy ngầm để kiểm tra, chụp từng slide khi xuất file, hoặc đóng gói và đưa lên mạng.

## Cấu trúc kho mã nguồn

| Đường dẫn | Mô tả |
|---|---|
| `templates/` | 34 mẫu, mỗi mẫu một thư mục chạy độc lập (`template.html`, tài nguyên, bản sao runtime) |
| `runtime/` | `deck-kit.js` và `deck-stage.js`; chỉ sửa hai file này ở đây, rồi chạy `npm run sync` để chép sang mọi mẫu |
| `scripts/` | Công cụ dòng lệnh: tạo deck, nhập Markdown và PowerPoint, kiểm tra, xuất file, đóng gói, deploy, chạy test |
| `examples/deck-kit-demo/` | Một deck trình diễn mọi tính năng |
| `examples/md-deck/` | Một bài thuyết trình mẫu viết bằng Markdown |
| `screenshots/` | Ảnh chụp các mẫu dùng trong README này |
| `assets/` | Ảnh banner của README và file HTML gốc để vẽ lại ảnh |
| `tests/fixtures/` | File PowerPoint, video và âm thanh mẫu dùng cho bộ test |
| `AGENTS.md`, `SKILL.md` | Hướng dẫn cho coding agent (cùng nội dung; `SKILL.md` theo định dạng skill) |
| `widgets-reference.md` | Danh sách mọi thuộc tính và tính năng tương tác, kèm ví dụ |
| `animation-patterns.md` | Cách thêm hiệu ứng chuyển động khi được yêu cầu |
| `index.json` | Mô tả phong cách, bảng màu, font và dịp phù hợp của từng mẫu, dùng để chọn mẫu |

## Đối tượng mục tiêu / Trường hợp sử dụng

- **Giáo viên, giảng viên:** bài giảng có hiện từng bước, câu hỏi trắc nghiệm, công thức, giải thích code và mô phỏng trực tiếp.
- **Người thuyết trình:** bài nói ở hội thảo, buổi gọi vốn, báo cáo, có màn hình người trình bày trên laptop.
- **Lập trình viên dùng coding agent:** mô tả bài nói, xem trước ba mẫu, nhận về bộ slide hoàn chỉnh kèm ghi chú.

## Yêu cầu hệ thống

### 1. Yêu cầu phần mềm

- Hệ điều hành: Linux, macOS hoặc Windows.
- Node.js 18 trở lên.
- Google Chrome hoặc Chromium, dùng để kiểm tra và xuất deck. Chỉ trình chiếu thì trình duyệt hiện đại nào cũng được.
- Git, để tải mã nguồn.

### 2. API Key & Thông tin xác thực

Chỉ cần khi đưa deck lên mạng, đăng nhập một lần:

- Vercel: `npx vercel login`
- Cloudflare Pages: `npx wrangler login`
- GitHub Pages: GitHub CLI (`gh auth login`)

---

## Hướng dẫn bắt đầu

### 1. Cài đặt

**Cách A: plugin cho Claude Code**

```text
/plugin marketplace add awun0105/deck-kit
/plugin install deck-kit@deck-kit
```

Lần đầu cần xuất file, Claude tự chạy `npm install` trong thư mục của plugin.

**Cách B: tải mã nguồn về máy** (cho agent khác, hoặc khi tự làm)

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit
npm install
```

Nếu Chrome được cài ở vị trí khác thường, đặt biến môi trường `CHROME_PATH=/đường/dẫn/tới/chrome`.

### 2. Kết nối với agent

- Agent hỗ trợ skill: tạo liên kết thư mục vào thư mục skill của agent, ví dụ `~/.claude/skills/deck-kit` hoặc `~/.codex/skills/deck-kit`.
- Agent khác: mở agent ngay trong thư mục `deck-kit` để agent tự đọc `AGENTS.md`, hoặc chỉ đường cho agent: "Đọc ~/deck-kit/AGENTS.md rồi làm bộ slide về …".

### 3. Kiểm tra cài đặt

Mở `examples/deck-kit-demo/index.html` bằng trình duyệt, bấm `→` để xem lần lượt. Sau đó kiểm tra các công cụ dòng lệnh:

```bash
node scripts/check-deck.mjs examples/deck-kit-demo/index.html
```

Lệnh in ra số slide, tổng số phút dự kiến và các cảnh báo nếu có.

### 4. Làm một bộ slide

**Nhờ agent:**

> Dùng deck-kit làm bộ slide 20 phút về [chủ đề] để trình bày trên lớp.

Agent hỏi vài câu, cho xem trước ba mẫu, rồi làm bộ slide hoàn chỉnh kèm ghi chú người nói.

**Tự làm từ một mẫu:**

```bash
node scripts/new-deck.mjs vellum ~/slides/kalman --lang=vi --title="Bộ lọc Kalman"
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

**Từ Markdown hoặc PowerPoint:**

```bash
node scripts/md-to-deck.mjs dan-y.md --theme=vellum
node scripts/pptx-to-deck.mjs bai-cu.pptx --theme=vellum
```

Tên mẫu chính là tên thư mục trong `templates/`.

### 5. Trình chiếu

Mở `index.html` của deck bằng trình duyệt. Bấm `?` để xem toàn bộ phím tắt.

| Phím | Tác dụng |
|---|---|
| `←` `→` `Space` `1`–`9` | Chuyển slide; `→` cũng hiện từng phần của slide |
| `P` | Mở màn hình người trình bày ở cửa sổ thứ hai (để trên laptop, kéo cửa sổ gốc sang máy chiếu ở chế độ màn hình mở rộng) |
| `N` / `M` / `T` | Ghi chú người nói / menu slide / đồng hồ |
| `B` / `W` | Tắt màn hình đen / trắng |
| `L` / `D` | Con trỏ laser / vẽ lên slide (`C` để xóa) |
| `Z` | Phóng to: kéo khung hoặc click; `Z` hoặc `Esc` để thu lại |
| `E` | Sửa trực tiếp; bấm `E` lần nữa để lưu vào file |
| `K` | Chép vị trí một phần tử để gửi agent |
| `X` | Bảng xuất file và chia sẻ |
| `F` | Toàn màn hình |
| `Ctrl+P` | In mọi slide ra PDF |

Giao diện các bảng điều khiển hiện tiếng Việt khi deck viết bằng tiếng Việt hoặc trình duyệt đặt tiếng Việt.

---

## Tùy chỉnh & Sử dụng nâng cao

### Slide tương tác

Mỗi tính năng chỉ cần một thuộc tính HTML và tự dùng màu, font của mẫu: `data-step` (hiện từng phần), `$…$` (công thức), `<pre data-lines="1-2|4">` (giải thích code từng dòng), `data-quiz`, `data-chart`, `data-stepper`, `data-compare`, `data-hotspot` và `data-qr`. Biểu đồ động trên canvas dùng `DeckKit.widget`, `DeckKit.plot` và `DeckKit.bind`. Danh sách đầy đủ kèm ví dụ nằm trong [widgets-reference.md](widgets-reference.md). Bản in và file xuất luôn hiện đủ mọi bước.

### Hiệu ứng chuyển động

Các mẫu giữ nguyên thiết kế gốc. Khi cần thêm chuyển động, agent làm theo [animation-patterns.md](animation-patterns.md); bản in PDF vẫn hiện trạng thái cuối cùng.

### Sửa slide

- **Phím `E`:** click để chọn, kéo để di chuyển, kéo các núm để đổi cỡ, double-click để gõ lại chữ, `Del` để ẩn, `Ctrl+Z` để hoàn tác. Bấm `E` lần nữa là lưu vào file HTML (Chrome và Edge; chọn file deck một lần). Chỉ những thẻ vừa sửa thay đổi.
- **Phím `K`:** click vào một phần tử để chép tên file, số dòng, số slide và selector, rồi dán vào chat kèm yêu cầu sửa.
- **Ghi chú người nói:** sửa trong màn hình người trình bày (`P`, rồi Sửa, rồi Lưu vào file).
- **Trí nhớ của deck:** file `CLAUDE.md` trong mỗi deck ghi lại mục đích, khán giả, giọng văn và các góp ý, để agent làm đúng ý ở những lần sau.

### Xuất file và đưa lên mạng

```bash
node scripts/export.mjs ~/slides/kalman/index.html                     # PDF, PNG và bản phát tay có ghi chú
node scripts/export.mjs ~/slides/kalman/index.html --compact --pptx    # PDF nhẹ để gửi email, PowerPoint
node scripts/export.mjs ~/slides/kalman/index.html --pptx-editable     # PowerPoint sửa được chữ
node scripts/bundle.mjs ~/slides/kalman/index.html                     # một file HTML chạy offline
node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel         # hoặc cloudflare, github
```

Mỗi deck có một link riêng, đặt theo tên thư mục (đổi bằng `--name`). Deploy lại cùng deck thì link cũ được cập nhật; tên đã thuộc về một deck khác thì lệnh hỏi lại trước khi ghi đè. `--preview` tạo link thử riêng, `--dry-run` chỉ chạy thử mà không đăng gì. Bảng `X` trong deck tạo sẵn các lệnh này với đúng đường dẫn của deck.

### Danh sách lệnh

| Lệnh | Mục đích |
|---|---|
| `scripts/new-deck.mjs <mẫu> <thư-mục>` | Tạo deck mới từ một mẫu |
| `scripts/md-to-deck.mjs talk.md --theme=<mẫu>` | Chuyển Markdown thành deck |
| `scripts/pptx-to-deck.mjs bai.pptx --theme=<mẫu>` | Chuyển PowerPoint thành deck: tiêu đề, gạch đầu dòng, bảng, ảnh, ghi chú |
| `scripts/check-deck.mjs <deck.html>` | Tìm chữ mẫu chưa thay, ảnh hỏng, chữ tràn khỏi slide, slide thiếu tiêu đề hoặc ghi chú |
| `scripts/export.mjs <deck.html>` | Xuất PDF, PNG, bản phát tay và PowerPoint |
| `scripts/bundle.mjs <deck.html>` | Đóng gói thành một file chạy offline |
| `scripts/deploy.mjs <deck.html> --to=…` | Đăng lên Vercel, Cloudflare Pages hoặc GitHub Pages |
| `scripts/apply-changes.mjs <deck.html> <file.json>` | Ghép ghi chú hoặc chỉnh sửa đã lưu từ Firefox, Safari |
| `npm test` | Kiểm tra mọi mẫu và deck trình diễn bằng Chrome chạy ngầm |

## Tài liệu hướng dẫn

- [AGENTS.md](AGENTS.md): hướng dẫn đầy đủ (quy trình làm việc, quy tắc giữ thiết kế, tính năng trình chiếu ở mục 8, công cụ ở mục 9, làm việc lâu dài với một deck ở mục 10).
- [widgets-reference.md](widgets-reference.md): mọi thuộc tính và tính năng tương tác.
- [animation-patterns.md](animation-patterns.md): các kiểu hiệu ứng chuyển động theo cảm giác.
- [examples/deck-kit-demo/index.html](examples/deck-kit-demo/index.html): deck chạy được, có đủ mọi tính năng.
- [examples/md-deck/talk.md](examples/md-deck/talk.md): định dạng Markdown để viết bài.

## Đóng góp

1. Fork repository và tạo nhánh mới.
2. Chỉ sửa runtime trong `runtime/`, sau đó chép sang các mẫu bằng `npm run sync`.
3. Chạy `npm test` (cần Chrome) và kiểm tra mọi mục đều đạt.
4. Mở pull request, mô tả rõ thay đổi.

## Cân nhắc bảo mật

- Deck đã đưa lên mạng là công khai. Ghi chú người nói bị loại khỏi bản đăng, trừ khi dùng `--keep-notes`; bản đăng cũng tắt chế độ sửa và bảng xuất file.
- Chế độ sửa trực tiếp chỉ ghi vào file được chọn qua hộp thoại của trình duyệt, và từ chối lưu nếu file đã thay đổi trên ổ đĩa sau khi trang được mở.
- Deck có công thức toán hoặc mã QR tải KaTeX và qrcode-generator từ jsDelivr; bản đóng gói offline đã nhúng sẵn nên không cần mạng.

## Lời cảm ơn

- [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) của Zara Zhang (MIT): dự án gốc và 34 hệ thống thiết kế.
- [frontend-slides](https://github.com/zarazhangrui/frontend-slides) của Zara Zhang (MIT): hướng dẫn về mật độ chữ, nguyên tắc tránh "AI slop" và ý tưởng nhập PowerPoint.
- [ai-deck-builder](https://github.com/Faris-Alanazi/ai-deck-builder) (MIT): ý tưởng sửa trực tiếp lưu vào file và link `#id` giữa các slide.

## Liên hệ

- Báo lỗi và đặt câu hỏi: [GitHub Issues](https://github.com/awun0105/deck-kit/issues)

## Bản quyền

Dự án được cấp phép theo giấy phép MIT; xem chi tiết trong file [LICENSE](LICENSE).

---

<div align="center">

[Về đầu trang](#top)

</div>
