<p align="center"><img src="./assets/banner.png" alt="deck kit — beautiful HTML slide templates" /></p>

<p align="center"><b>Tiếng Việt</b> · <a href="./README.en.md">English</a></p>

**deck-kit** giúp bạn làm bài thuyết trình đẹp bằng HTML, nhờ coding agent (Claude Code, Codex, Gemini CLI…) làm hộ phần lớn công việc. Repository này có **34 mẫu slide** thiết kế sẵn, một **bộ điều khiển trình chiếu** gắn vào mọi mẫu, và **các lệnh** để xuất PDF / PowerPoint, nhập PowerPoint có sẵn, hay đưa deck lên mạng.

Bạn nói với agent muốn trình bày gì; agent chọn mẫu, viết nội dung, bạn mở file bằng trình duyệt là trình chiếu được — không cần PowerPoint, không cần mạng.

**Mục lục:** [Repository này chứa gì](#repository-này-chứa-gì) · [Cài đặt](#cài-đặt) · [Làm bộ slide đầu tiên](#làm-bộ-slide-đầu-tiên) · [Trình chiếu](#trình-chiếu) · [Làm slide sinh động](#làm-slide-sinh-động) · [Sửa slide](#sửa-slide) · [Xuất file và chia sẻ](#xuất-file-và-chia-sẻ) · [Danh sách lệnh](#danh-sách-lệnh) · [Thư viện mẫu](#thư-viện-mẫu)

## Repository này chứa gì

| Thư mục / file | Là gì |
|---|---|
| [`templates/`](./templates/) | 34 mẫu slide, mỗi mẫu một thư mục chạy độc lập (`template.html`). Xem ảnh ở [Thư viện mẫu](#thư-viện-mẫu) |
| [`runtime/deck-kit.js`](./runtime/deck-kit.js) | "Bảng điều khiển" trình chiếu gắn sẵn vào mọi mẫu: màn hình người trình bày, ghi chú, đồng hồ, laser, vẽ, chỉnh sửa trực tiếp, in PDF, và các tính năng tương tác (hiện từng bước, công thức, trắc nghiệm, biểu đồ…) |
| [`scripts/`](./scripts/) | Các lệnh: tạo deck, chuyển Markdown / PowerPoint thành deck, kiểm tra lỗi, xuất file, gói offline, deploy |
| [`examples/deck-kit-demo/`](./examples/deck-kit-demo/index.html) | Một deck mẫu có đủ mọi tính năng — mở ra là thấy deck-kit làm được gì |
| [`AGENTS.md`](./AGENTS.md) / [`SKILL.md`](./SKILL.md) | Hướng dẫn cho agent: hỏi gì, chọn mẫu ra sao, giữ thiết kế thế nào (SKILL.md là cùng nội dung, dạng skill) |
| [`widgets-reference.md`](./widgets-reference.md) | Danh sách đầy đủ mọi thuộc tính và tính năng tương tác, kèm ví dụ |
| [`animation-patterns.md`](./animation-patterns.md) | Hướng dẫn thêm hiệu ứng chuyển động khi bạn yêu cầu |
| [`index.json`](./index.json) | Mô tả từng mẫu (phong cách, màu, font, hợp dịp nào) để agent chọn mẫu |

## Cài đặt

**Cần có:** [Node.js](https://nodejs.org) 18 trở lên và Google Chrome (hoặc Chromium). Chrome dùng để kiểm tra deck và xuất PDF / ảnh / PowerPoint; chỉ trình chiếu thì trình duyệt nào cũng được.

### Cách 1 — Claude Code (plugin)

Gõ trong Claude Code:

```
/plugin marketplace add awun0105/deck-kit
/plugin install deck-kit@deck-kit
```

Xong. Từ giờ cứ nhờ Claude làm slide là nó dùng deck-kit. Lần đầu cần xuất file, Claude sẽ tự chạy `npm install` trong thư mục của plugin.

### Cách 2 — Agent khác (Codex, Gemini CLI, Cursor…) hoặc tự cài

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit
npm install          # một lần; tải công cụ xuất file, dùng Chrome có sẵn trên máy
```

Để agent dùng được:
- Agent có hỗ trợ skill: clone (hoặc tạo symlink) vào thư mục skill của agent, ví dụ `~/.claude/skills/deck-kit` hay `~/.codex/skills/deck-kit`.
- Agent khác: mở agent ngay trong thư mục `deck-kit` (nó tự đọc `AGENTS.md`), hoặc nhắc: *"Đọc ~/deck-kit/AGENTS.md rồi làm cho tôi bộ slide về…"*.

Nếu Chrome nằm ở chỗ lạ, đặt biến môi trường `CHROME_PATH=/đường/dẫn/tới/chrome`.

### Kiểm tra cài đặt

Mở file `examples/deck-kit-demo/index.html` bằng trình duyệt, bấm `→` để xem qua, bấm `?` để xem phím tắt. Muốn chắc các lệnh chạy được:

```bash
node scripts/check-deck.mjs examples/deck-kit-demo/index.html
```

## Làm bộ slide đầu tiên

**Nhờ agent (khuyên dùng).** Nói với agent, ví dụ:

> Dùng deck-kit làm cho tôi bộ slide về [chủ đề], [số phút] phút, để tôi trình bày trên lớp.

Agent sẽ hỏi vài câu (dịp gì, muốn cảm giác ra sao, deck để đọc hay để nói), cho bạn xem trước 3 mẫu, rồi làm bộ slide hoàn chỉnh kèm ghi chú người nói.

**Tự làm từ một mẫu:**

```bash
node scripts/new-deck.mjs vellum ~/slides/kalman --lang=vi --title="Bộ lọc Kalman"
# mở ~/slides/kalman/index.html, sửa nội dung, rồi kiểm tra:
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

**Từ dàn ý Markdown hoặc PowerPoint có sẵn:**

```bash
node scripts/md-to-deck.mjs dan-y.md --theme=vellum           # viết bằng Markdown (xem examples/md-deck/talk.md)
node scripts/pptx-to-deck.mjs bai-cu.pptx --theme=vellum      # nhập từ PowerPoint
```

Tên mẫu (`vellum`, `coral`, `grove`…) là tên thư mục trong `templates/`.

## Trình chiếu

Mở `index.html` của deck bằng trình duyệt. Bấm `?` bất cứ lúc nào để xem phím tắt.

| Phím | Làm gì |
|---|---|
| `←` `→` `Space` `1`–`9` | Chuyển slide (`→` cũng hiện từng phần của slide nếu có) |
| `P` | **Màn hình người trình bày** — cửa sổ thứ hai có slide hiện tại, slide kế tiếp, ghi chú và đồng hồ. Để cửa sổ này trên laptop, kéo cửa sổ gốc sang máy chiếu (màn hình để chế độ *mở rộng*) |
| `N` | Ghi chú người nói (hiện ngay trên màn hình) |
| `M` | Menu các slide, có phút dự kiến |
| `T` | Đồng hồ: đã nói bao lâu, đang nhanh hay chậm so với kế hoạch |
| `B` / `W` | Tắt màn hình đen / trắng |
| `L` | Con trỏ laser |
| `D` | Vẽ lên slide (`C` xoá, `Backspace` hoàn tác) |
| `Z` | Phóng to: kéo khung (hoặc click) vào chỗ muốn phóng; `Z` / `Esc` để thu lại. Ở màn hình người trình bày thì kéo khung trên ô slide hiện tại, máy chiếu phóng theo |
| `E` | Chỉnh sửa trực tiếp (xem [Sửa slide](#sửa-slide)) |
| `K` | Chép vị trí một phần tử để gửi cho agent |
| `X` | Xuất file và chia sẻ |
| `F` | Toàn màn hình |
| `Ctrl+P` | In ra PDF, mỗi slide một trang |

Giao diện các bảng là tiếng Việt khi deck viết bằng tiếng Việt hoặc trình duyệt của bạn đặt tiếng Việt.

## Làm slide sinh động

Mẫu nào cũng chạy được biểu đồ động, thanh trượt, nút "xem đáp án", đồng hồ đếm ngược — hợp cho bài giảng. Mỗi thứ dưới đây chỉ cần một thuộc tính HTML, màu và font tự theo mẫu:

- **Hiện từng phần** — bấm `→` hiện ý tiếp theo, `←` ẩn lại; click chuột, cuộn chuột, vuốt hay nút ‹ › của mẫu cũng đi qua từng bước.
- **Công thức toán** — gõ `$x^2$` hay `$$…$$` là ra công thức đẹp.
- **Code** — tô màu cú pháp, bấm `→` để làm nổi từng dòng, có nút chép code.
- **Câu hỏi trắc nghiệm** — bấm vào đáp án là biết đúng sai, kèm giải thích.
- **Biểu đồ cột, đường, tròn** — từ một bảng số liệu hoặc vài con số.
- **Mô phỏng** có nút phát / dừng / từng bước.
- **Thanh kéo so sánh trước / sau** cho hai tấm ảnh.
- **Chấm chú thích trên ảnh** — bấm vào số để hiện giải thích.
- **Mã QR** dẫn tới link bất kỳ.
- **Video, âm thanh, YouTube** — không tự phát, có nút tắt tiếng, chuyển slide là tự dừng.
- **Hiệu ứng chuyển động** — các mẫu giữ nguyên như thiết kế gốc; khi bạn muốn "sống động hơn", agent thêm theo [`animation-patterns.md`](./animation-patterns.md).

Bạn chỉ cần nói với agent điều mình muốn ("cho câu hỏi trắc nghiệm vào cuối phần 2", "vẽ biểu đồ doanh thu từ bảng này"); agent tra cách làm trong [`widgets-reference.md`](./widgets-reference.md). Bản in và file xuất luôn hiện đủ mọi bước. Xem thử tất cả trong [`examples/deck-kit-demo/index.html`](./examples/deck-kit-demo/index.html).

## Sửa slide

- **Sửa bằng tay (`E`)** — bấm `E`, click vào chữ hay hình: kéo để di chuyển, kéo núm để đổi cỡ, double-click để gõ lại chữ, `Del` để ẩn, `Ctrl+Z` để hoàn tác. Bấm `E` lần nữa là **lưu thẳng vào file HTML** (Chrome/Edge; chọn file deck một lần). Chỉ đúng chỗ bạn sửa bị thay đổi.
- **Nhờ agent sửa (`K`)** — bấm `K` rồi click vào chỗ cần sửa; vị trí chính xác (file, slide, phần tử) được chép vào clipboard. Dán vào chat kèm yêu cầu: *"[vị trí] — viết lại câu này ngắn hơn"*.
- **Ghi chú người nói** — sửa ngay trong màn hình người trình bày (`P` → ✎ Sửa → 💾 Lưu vào file).
- **`CLAUDE.md` của từng deck** — "trí nhớ" của deck cho agent: mục đích, khán giả, giọng văn, góp ý của bạn. Lần sau mở phiên chat mới, agent đọc lại là làm đúng ý mà không phải dặn lại.

## Xuất file và chia sẻ

Bấm `X` trong deck: in PDF ngay, hoặc tick định dạng / nơi deploy rồi bấm **Chép lệnh** — dán vào terminal hay gửi cho agent chạy. Hoặc gõ thẳng:

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

## Danh sách lệnh

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

Muốn đi sâu hơn: [`AGENTS.md`](./AGENTS.md) — mục 8 (trình chiếu), 9 (công cụ), 10 (làm việc lâu dài với một deck).

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
