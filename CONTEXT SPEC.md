# HACKATHON SPECIFICATION: QLOO AGENTIC HACKATHON

## 1. TỔNG QUAN CUỘC THI (OVERVIEW)
- Tên cuộc thi: Qloo Agentic Hackathon ("Agents, but with taste")
- Đơn vị tổ chức: Qloo & Devpost
- Tổng giải thưởng: $25,000 USD (Giải 1: $15,000 | Giải 2: $6,000 | Giải 3: $4,000)
- Deadline nộp bài: 31/10/2026 @ 10:45 AM GMT+7 (30/10/2026 @ 11:45 PM ET)

## 2. NỖI ĐAU CỐT LÕI & ĐỀ BÀI (CORE PROBLEM & THEME)
- Vấn đề: Các LLM và hệ thống Agent hiện nay có thể lập luận, lập kế hoạch và thực thi công việc rất tốt, nhưng bị "mù văn hóa" (culturally blind) — chúng đoán mò về gu thẩm mỹ, sở thích và điều con người thực sự yêu thích.
- Nhiệm vụ: Xây dựng một công cụ Agentic, ứng dụng chạy bằng Agent, hoặc tích hợp API của Qloo vào một Agent có sẵn.
- Trọng tâm công nghệ: Tận dụng đồ thị gu thưởng thức (Qloo Taste Graph với 250M+ thực thể) trên các lĩnh vực: âm nhạc, điện ảnh, ẩm thực, thời trang, du lịch, phong cách sống... để mang lại "Trí tuệ văn hóa" (Cultural Grounding) thực thụ cho Agent.
- Tuyên ngôn bắt buộc: "Nếu sản phẩm của bạn không có Qloo mà vẫn chạy được như cũ bằng LLM thông thường, bạn đã chọn sai đề tài." Sự hiện diện của Qloo phải là yếu tố tạo ra khác biệt cốt lõi.

## 3. RÀNG BUỘC KỸ THUẬT & YÊU CẦU NỘP BÀI (SUBMISSION DELIVERABLES)
Để bài dự thi hợp lệ, BẮT BUỘC phải có đầy đủ:
1. Live Demo Application: Một ứng dụng đang chạy thực tế trên môi trường public (Web App URL, APK tải về, hoặc TestFlight build). Không chấp nhận localhost hoặc video ghi hình đơn thuần.
2. Public Repository: Link repo công khai (GitHub/GitLab/Bitbucket) chứa toàn bộ mã nguồn, tài nguyên và hướng dẫn cài đặt.
3. Open-Source License: Repo phải có file LICENSE mã nguồn mở hợp lệ (MIT, Apache 2.0,...) hiển thị rõ trong phần "About" của repo.
4. Text Description: Bài viết mô tả chi tiết bài toán, tính năng cốt lõi và kiến trúc chứng minh cách thức dự án được "Qloo-powered".

## 4. TIÊU CHÍ CHẤM ĐIỂM (JUDGING CRITERIA - TRỌNG SỐ ĐỒNG ĐỀU 25%)
1. Technological Implementation (25%): 
   - Mức độ tích hợp sâu và thành thạo Qloo API.
   - Mã nguồn thể hiện nỗ lực nghiêm túc, kiến trúc Agentic non-trivial (không phải simple wrapper).
2. Design & Experience (25%):
   - Trải nghiệm sản phẩm hoàn chỉnh, mạch lạc, trực quan; không chỉ là một Proof of Concept (PoC) thô sơ.
3. Potential Impact (25%):
   - Giải quyết bài toán thực tế, rõ ràng cho tệp người dùng cụ thể. Có tính khả thi thương mại cao.
4. Quality of the Idea (25%):
   - Cách tiếp cận sáng tạo, phi hiển nhiên (non-obvious), hiểu sâu về không gian văn hóa/gu thẩm mỹ.

## 5. CHÂN DUNG DÀN GIÁM KHẢO (JUDGE PERSONAS & PITCHING TARGET)
Mọi giải pháp và kịch bản demo cần tối ưu để gây ấn tượng với các nhóm giám khảo sau:
- Jason Calacanis (Angel Investor/Bestie): Quan tâm đến sản phẩm B2B/SaaS thực dụng, mô hình kinh doanh rõ ràng, giải quyết nỗi đau lớn, có khả năng kiếm tiền ngay.
- Todd Boehly (Chủ tịch Eldridge Industries / Chelsea FC): Đại diện cho giới tài chính, thể thao và giải trí đỉnh cao; quan tâm đến hospitality, quan hệ VIP, deal-making giá trị lớn.
- Nicole Seligman (Thành viên HĐQT OpenAI): Quan tâm đến kiến trúc Agent, khả năng suy luận tự chủ, tính an toàn và quản trị dữ liệu.
- Mike Diolosa (CTO Qloo): Soi kỹ cách hệ thống truy vấn và tận dụng đồ thị liên kết chéo miền (Cross-domain taste graph) của Qloo.
- Michael Abrams (EVP Strategic Initiatives, Live Nation): Chuyên gia về trải nghiệm người hâm mộ, sự kiện trực tiếp, âm nhạc và giải trí đại chúng.

## 6. NHỮNG ĐIỀU CẤM & ANTI-PATTERNS CẦN TRÁNH
- KHÔNG làm Consumer Toy Apps đơn thuần (như chatbot hỏi "hôm nay nghe nhạc gì, ăn gì").
- KHÔNG dùng Qloo như một cơ sở dữ liệu tìm kiếm tĩnh; phải khai thác khả năng "Cross-domain Inference" (ví dụ: từ gu phim ảnh/kiến trúc suy ra gu rượu, thời trang, nhà hàng).
- Tránh các đề tài quá cồng kềnh về mặt logistics thực tế (như tổ chức festival hàng nghìn người) khiến demo bị loãng hoặc giả lập thiếu thuyết phục.