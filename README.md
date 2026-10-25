# deck-kit

**Tiếng Việt** · [English](./README.en.md)

Bộ công cụ làm slide bằng HTML cho người dùng coding agent (Claude Code, Codex, Gemini CLI…): **34 mẫu thiết kế đẹp sẵn**, kèm **bộ điều khiển trình chiếu** chạy ngay trong file HTML, và **các lệnh** để xuất PDF/PowerPoint, nhập PowerPoint có sẵn, đưa deck lên mạng.

Bạn chỉ cần nói với agent muốn làm bài thuyết trình gì. Agent chọn mẫu, đổ nội dung vào, bạn mở file ra là trình chiếu được — không cần cài PowerPoint, không cần mạng.

## Có gì trong này

- **34 mẫu slide** với phong cách rất khác nhau: tạp chí, tối giản, cổ động, retro, pastel, pixel game… (xem [thư viện mẫu](#thư-viện-mẫu) ở cuối).
- **deck-kit.js** — "bảng điều khiển" gắn sẵn vào mọi mẫu: màn hình người trình bày, ghi chú, đồng hồ, con trỏ laser, vẽ lên slide, chỉnh sửa trực tiếp, in PDF…
- **Các lệnh trong `scripts/`** — tạo deck mới, viết bằng Markdown, nhập PowerPoint, kiểm tra lỗi, xuất file, deploy.

## Bắt đầu nhanh

**Cách 1 — nhờ agent (khuyên dùng).** Nói với agent:

> Dùng deck-kit làm cho tôi bộ slide về [chủ đề], [số phút] phút, để tôi trình bày trên lớp.

Agent sẽ hỏi bạn vài câu (dịp gì, muốn cảm giác ra sao, deck để đọc hay để nói), cho bạn xem trước 3 mẫu, rồi làm bộ slide hoàn chỉnh kèm ghi chú người nói. Cách làm việc chi tiết của agent nằm trong [`AGENTS.md`](./AGENTS.md).

**Cách 2 — tự làm:**

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit && npm install            # một lần; dùng Chrome có sẵn trên máy

node scripts/new-deck.mjs vellum ~/slides/kalman --lang=vi --title="Bộ lọc Kalman"
# mở ~/slides/kalman/index.html, sửa nội dung, rồi:
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

Bạn đã có slide PowerPoint hoặc thích viết bằng Markdown?

```bash
node scripts/pptx-to-deck.mjs bai-cu.pptx --theme=vellum      # nhập từ PowerPoint
node scripts/md-to-deck.mjs dan-y.md --theme=vellum           # viết bằng Markdown (xem examples/md-deck/talk.md)
```

> Cần **Node.js** và **Google Chrome**. Nếu dùng hệ thống skills-hub, repo nằm ở `~/.agents/skills/deck-kit`.

## Khi trình chiếu

Mở file `index.html` bằng trình duyệt là trình chiếu được. Bấm `?` để xem toàn bộ phím tắt.

| Phím | Làm gì |
|---|---|
| `←` `→` `Space` `1`–`9` | Chuyển slide |
| `P` | **Màn hình người trình bày** — mở cửa sổ thứ hai có slide hiện tại, slide kế tiếp, ghi chú và đồng hồ. Để cửa sổ này trên laptop, cửa sổ gốc kéo sang máy chiếu (màn hình để chế độ *mở rộng*). Kéo thanh trượt ở cửa sổ nào thì cửa sổ kia đổi theo |
| `N` | Ghi chú người nói (hiện ngay trên màn hình) |
| `M` | Menu các slide, có phút dự kiến |
| `T` | Đồng hồ: đã nói bao lâu, đang nhanh hay chậm so với kế hoạch |
| `B` / `W` | Tắt màn hình đen / trắng |
| `L` | Con trỏ laser |
| `D` | Vẽ lên slide (`C` xoá, `Backspace` hoàn tác) |
| `E` | **Chỉnh sửa** — xem bên dưới |
| `K` | Chép vị trí một phần tử để gửi cho agent |
| `X` | Xuất file & chia sẻ |
| `F` | Toàn màn hình |
| `Ctrl+P` | In ra PDF, mỗi slide một trang (biểu đồ hiện đủ) |

Giao diện các bảng là tiếng Việt khi deck viết bằng tiếng Việt hoặc trình duyệt của bạn đặt tiếng Việt.

## Slide tương tác

Mẫu nào cũng chạy được biểu đồ động, thanh trượt, nút "xem đáp án", đồng hồ đếm ngược — hợp cho bài giảng. Agent viết các phần này bằng `DeckKit.widget`, `DeckKit.plot`, `DeckKit.bind`; màu tự lấy theo mẫu. Xem thử: mở [`examples/deck-kit-demo/index.html`](./examples/deck-kit-demo/index.html).

## Video, âm thanh và chuyển động

- **Video, âm thanh, YouTube**: chèn `<video src="clip.mp4">`, `<audio src="nhac.mp3">` hoặc khung YouTube vào slide (trong Markdown: `![](clip.mp4)`, `![](nhac.mp3)`, hoặc dán link YouTube trên một dòng riêng). Không có gì tự phát — bấm để phát, có sẵn nút tắt tiếng; chuyển sang slide khác là tự dừng và quay về đầu.
- **Chuyển động**: các mẫu giữ nguyên như thiết kế gốc. Khi bạn muốn slide "sống động" hơn, cứ nhờ agent — agent làm theo hướng dẫn trong [`animation-patterns.md`](./animation-patterns.md) (chọn hiệu ứng theo cảm giác, chữ hiện dần, xuất hiện lần lượt, số đếm lên…); bản in PDF vẫn hiện đầy đủ.

## Sửa slide

- **Sửa nhanh bằng tay (`E`)** — bấm `E`, click vào chữ hay hình trên slide: kéo để di chuyển, kéo núm để đổi cỡ, double-click để gõ lại chữ, `Del` để ẩn, `Ctrl+Z` để hoàn tác. Bấm `E` lần nữa là **lưu thẳng vào file HTML** (Chrome/Edge; chọn file deck một lần). Chỉ đúng chỗ bạn sửa bị thay đổi.
- **Nhờ agent sửa (`K`)** — bấm `K` rồi click vào chỗ cần sửa; vị trí chính xác (file, slide, phần tử) được chép vào clipboard. Dán vào chat kèm yêu cầu: *"[vị trí] — viết lại câu này ngắn hơn"*.
- **Ghi chú người nói** — sửa ngay trong màn hình người trình bày (`P` → ✎ Sửa → 💾 Lưu vào file).
- **`CLAUDE.md` của từng deck** — "trí nhớ" của deck cho agent: mục đích, khán giả, giọng văn, quy tắc, các góp ý của bạn. Lần sau mở phiên chat mới, agent đọc lại là làm đúng ý bạn mà không phải dặn lại.

## Xuất file & chia sẻ

Bấm `X` trong deck: in PDF ngay, hoặc tick định dạng / nơi deploy rồi bấm **Chép lệnh** — dán vào terminal hay gửi cho agent chạy.

```bash
node scripts/export.mjs ~/slides/kalman/index.html                      # PDF + ảnh PNG + bản phát tay có ghi chú
node scripts/export.mjs ~/slides/kalman/index.html --compact --pptx     # PDF nhẹ để gửi email, PowerPoint
node scripts/export.mjs ~/slides/kalman/index.html --pptx-editable      # PowerPoint sửa được chữ (+ thư mục font để cài)
node scripts/bundle.mjs ~/slides/kalman/index.html                      # một file HTML duy nhất, chạy không cần mạng
node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel          # hoặc cloudflare / github → có link chia sẻ
```

Về deploy:
- Mỗi deck một link riêng (theo tên thư mục, đổi bằng `--name`). Deploy lại cùng deck thì cập nhật link đó; nếu lỡ trùng tên với **deck khác**, lệnh sẽ hỏi trước khi ghi đè.
- **Ghi chú người nói không được đưa lên** (ai có link cũng đọc được) — thêm `--keep-notes` nếu muốn kèm.
- `--preview` tạo link xem thử, không đụng link chính. `--dry-run` chỉ xem trước, không đăng gì.
- Vercel / Cloudflare cần đăng nhập một lần (`npx vercel login`, `npx wrangler login`); GitHub Pages dùng `gh` có sẵn.

## Các lệnh

| Lệnh | Để làm gì |
|---|---|
| `scripts/new-deck.mjs <mẫu> <thư-mục>` | Tạo deck mới từ một mẫu |
| `scripts/md-to-deck.mjs talk.md --theme=<mẫu>` | Markdown → deck (bố cục chuẩn, màu và font của mẫu) |
| `scripts/pptx-to-deck.mjs bai.pptx --theme=<mẫu>` | Nhập PowerPoint: tiêu đề, gạch đầu dòng, bảng, ảnh, ghi chú |
| `scripts/check-deck.mjs <deck.html>` | Kiểm tra lỗi: chữ mẫu chưa thay, ảnh hỏng, chữ tràn khỏi slide… |
| `scripts/export.mjs <deck.html>` | Xuất PDF, PNG, bản phát tay, PowerPoint |
| `scripts/bundle.mjs <deck.html>` | Gói thành một file chạy offline |
| `scripts/deploy.mjs <deck.html> --to=…` | Đưa lên Vercel, Cloudflare Pages hoặc GitHub Pages |
| `scripts/apply-changes.mjs <deck.html> <file.json>` | Ghép ghi chú / chỉnh sửa đã lưu từ Firefox, Safari |
| `npm test` | Chạy bộ kiểm tra tự động cho cả 34 mẫu |

Hướng dẫn đầy đủ (cho agent và cho người muốn đi sâu): [`AGENTS.md`](./AGENTS.md) — mục 8 (trình chiếu), 9 (công cụ), 10 (làm việc lâu dài với một deck).

## Thư viện mẫu

34 mẫu, mỗi mẫu 3 slide minh hoạ (bìa · giữa bài · cuối bài). Bấm tên mẫu để xem thư mục của nó.

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

## Ghi công & giấy phép

- deck-kit phát triển từ [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) của Zara Zhang (MIT) — 34 mẫu thiết kế là của dự án gốc.
- Hướng dẫn về mật độ chữ, nguyên tắc chống "AI slop" và ý tưởng nhập PowerPoint lấy từ [frontend-slides](https://github.com/zarazhangrui/frontend-slides) (MIT, Zara Zhang).
- Chỉnh sửa trực tiếp lưu vào file và link `#id` giữa các slide lấy cảm hứng từ [ai-deck-builder](https://github.com/Faris-Alanazi/ai-deck-builder) (MIT).
- Giấy phép: [MIT](./LICENSE).
