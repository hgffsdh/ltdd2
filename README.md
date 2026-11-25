# Smart Parking Hub 4.0 — Node.js + Firebase thật (Spark)

Bản V4 giữ toàn bộ giao diện và luồng nghiệp vụ V3, thay Firebase Cloud Functions bằng Node.js + Express REST API. Không có chế độ demo, ví ảo, hoặc giả lập giao dịch. Firebase Authentication và Firestore thật. Thanh toán tiền mặt do nhân viên xác nhận. Không cần Blaze nếu dùng các dịch vụ Firebase trong hạn mức Spark và chạy backend riêng. Máy chủ cần luôn bật khi vận hành.

## 1. Chuẩn bị trên Windows

Giải nén ZIP vào `D:\SmartParkingHubV4` (bên trong có thư mục `SmartParkingHub`). Không xóa V3. Cần Node.js 22 (>=22.13). Dự án Firebase mặc định: `smart-parking-hub`. Firestore Security Rules của V4 giống hệt V3 đã deploy. Không cần chạy lại `firebase deploy --only functions`.

```cmd
cd /d D:\SmartParkingHubV4\SmartParkingHub
copy "D:\SmartParkingHub\src\services\firebaseConfig.js" "src\services\firebaseConfig.js"
npm ci
cd server
npm install
npm test
cd ..
```

Nếu CMD hỏi ghi đè firebaseConfig, chọn Y. File V3 trên máy bạn phải đã dùng project `smart-parking-hub`, import initializeApp/getAuth/getFirestore và export auth, db, default app (không dùng getAnalytics). Nếu chưa đúng, dùng file mẫu V4, điền API key và kiểm tra toàn bộ config từ Firebase Console > Project settings > Your apps > SDK setup and configuration. Không dùng config project cũ `bai-dau-xe`. Bản ZIP không chứa API key thực của dự án mới; bạn dùng cấu hình Web SDK của chính bạn.

Kiểm tra Firebase Console: Authentication > Sign-in method > Email/Password enabled; Firestore Database `(default)` đã tạo; rules đã deploy. Không mở rules thành allow write: if true. Nếu sử dụng project mới khác, sửa `.firebaserc`, config Web SDK và biến môi trường server đồng bộ.

## 2. Cấp thông tin xác thực riêng cho backend

Mở https://console.firebase.google.com/project/smart-parking-hub/settings/serviceaccounts > Firebase Admin SDK > Generate new private key. Tải JSON về, lưu ngoài mã nguồn, ví dụ `D:\private\smart-parking-hub-admin.json`. Có thể dùng thư mục riêng với quyền Windows chỉ tài khoản vận hành được đọc. Không gửi JSON, không đưa vào thư mục app, không commit Git. Nếu chính sách trường cấm tạo service-account key, phải nhờ quản trị viên cấp cơ chế xác thực hợp lệ; không có cách bỏ qua bằng API key web. Hướng dẫn chính thức: https://firebase.google.com/docs/admin/setup .

Mở CMD backend:

```cmd
cd /d D:\SmartParkingHubV4\SmartParkingHub\server
set "GOOGLE_APPLICATION_CREDENTIALS=D:\private\smart-parking-hub-admin.json"
set "FIREBASE_PROJECT_ID=smart-parking-hub"
```

Các biến set chỉ tồn tại trong cửa sổ CMD hiện tại. Server kiểm tra project_id trong JSON để tránh ghi nhầm project.

## 3. Khai báo bãi xe thật (một lần, trước khi mở cho khách)

```cmd
node setup.cjs smart-parking-hub seed 24
```

24 là số vị trí cấu hình ví dụ của V3, thay bằng số vị trí thực (1–500). Script chỉ thêm slot chưa tồn tại, không ghi đè. Mặc định 4 slot đầu 20.000 VND/giờ, còn lại 10.000 VND/giờ; khu A 1–8, B 9–16, C từ 17. Chỉ chạy khi đã kiểm tra vị trí thực, và chỉnh khu/giá/trạng thái của từng slot qua console trước khi mở bãi. Không chỉnh bằng tay slot đang gắn với vé. Không coi trạng thái nghiệp vụ là dữ liệu cảm biến. Nếu bãi không trống cần đối soát xe trước. Giá làm tròn lên mỗi giờ, tối thiểu 1 giờ; chủ bãi phải phê duyệt.

## 4. Chạy backend và kết nối điện thoại

Trong cùng CMD đã set credentials:

```cmd
npm start
```

Mở CMD khác kiểm tra:

```cmd
curl http://localhost:3000/health
ipconfig
```

Health trả `ok:true`, `service:smart-parking-api`, `projectId:smart-parking-hub`. Đây là kiểm tra server HTTP, chưa xác nhận kết nối Firestore. Kiểm tra kết nối DB bằng seed và luồng đăng ký/đặt chỗ thật.

Lấy IPv4 Address của Wireless LAN adapter Wi-Fi (ví dụ 192.168.1.100). Tại CMD frontend:

```cmd
cd /d D:\SmartParkingHubV4\SmartParkingHub
copy .env.example .env
notepad .env
```

Đổi thành `EXPO_PUBLIC_API_URL=http://IP_LAPTOP:3000` với IP thật (không gõ IP_LAPTOP). Trên điện thoại cùng Wi-Fi, mở `http://IP_LAPTOP:3000/health` bằng trình duyệt để kiểm tra. Nếu lỗi, kiểm tra IP, backend, Wi-Fi không cô lập client; chỉ cho phép Node.js qua firewall trên mạng Private tin cậy, không tắt firewall, không mở port ra Internet. Expo Go và Android có thể từ chối HTTP tùy bản; production phải dùng HTTPS. Dùng LAN HTTP chỉ để nghiệm thu bằng tài khoản kiểm thử, không truyền token của khách thật qua HTTP. Server hỗ trợ TLS bằng `TLS_CERT_PATH` và `TLS_KEY_PATH`, hoặc đặt reverse proxy HTTPS với chứng chỉ hợp lệ và `HOST=127.0.0.1`. Đặt URL app sang `https://...` khi dùng thật. Không bỏ qua kiểm tra chứng chỉ. Không lưu service-account key trong EXPO_PUBLIC variables.

```cmd
npx expo start --clear
```

Quét QR Expo Go tương thích SDK 58 hoặc dùng development build. Không đóng cửa sổ backend. Nếu IP đổi, cập nhật .env rồi restart Expo. Native Android/iOS được hỗ trợ theo kiến trúc; API không mở CORS cho trình duyệt, web Expo chưa cấu hình hỗ trợ. Tunnel Expo không tự tunnel backend.

## 5. Cấp quyền nhân viên

Đăng ký 1 tài khoản nhân viên bằng app (hoặc tạo ở Firebase Authentication). Mở CMD backend khác, set lại GOOGLE_APPLICATION_CREDENTIALS như mục 2 rồi chạy:

```cmd
cd /d D:\SmartParkingHubV4\SmartParkingHub\server
node setup.cjs smart-parking-hub staff EMAIL_NHAN_VIEN
```

Thay EMAIL_NHAN_VIEN bằng email đã đăng ký. Đăng xuất/đăng nhập lại, tab Vận hành xuất hiện. Thu hồi bằng `node setup.cjs smart-parking-hub revoke EMAIL_NHAN_VIEN`. Server xác thực ID token với kiểm tra thu hồi, rules Firestore vẫn có thể nhận token cũ tới khi hết hạn. Không dùng chung mật khẩu.

## 6. Kiến trúc và an toàn

- `server/index.cjs`: Node.js server, Firebase Admin SDK với project xác định.
- `server/api.cjs`: POST `/api/parking/action`, xác thực Bearer Firebase ID token; UID và custom claim lấy từ token đã xác thực, không tin dữ liệu client; giới hạn JSON 16KB. GET `/health` không chứa bí mật.
- `server/parkingAction.cjs`: các transaction giữ chỗ, hồ sơ, vào/ra, chốt phí, tiền mặt và nhật ký. Giá, thời gian và quyền được tính/kiểm tra server.
- `src/services/parkingService.js`: gọi REST, lắng nghe Firestore realtime, thông báo lỗi kết nối.
- `firestore.rules`: client chỉ đọc theo quyền; không ghi trực tiếp. Admin SDK có quyền quản trị, giữ server và khóa riêng an toàn.
- Chưa có rate limiting tập trung, giám sát tải, App Check, backup tự động, HTTPS công khai, thanh toán ngân hàng, ESP32/camera/barrier. Trước khi dùng cho khách thật cần nghiệm thu, TLS, giới hạn lạm dụng, bảo vệ server và quy trình vận hành.

## 7. Quy trình vận hành thực tế

1. Khách nhập biển số, chọn vị trí trống, giữ chỗ 15 phút (`reserved`). Không thu tiền ở bước này. Mã vé xuất hiện trong app.
2. Nhân viên đối chiếu xe và biển số tại bãi; xác nhận xe đã vào đúng chỗ (`active`). Máy chủ bắt đầu tính phí. Hết hạn giữ chỗ thì phải hủy/đặt lại. Không tự động giải phóng chỗ hết hạn: nhân viên phải đối soát để tránh đánh dấu trống nhầm.
3. Khách gửi yêu cầu ra bãi (`exit_requested`); chưa dừng tính phí. Nhân viên tại quầy xác nhận khách và xe đang làm thủ tục, chốt số tiền (`quoted`). Từ thời điểm chốt phí, giá không tăng thêm trong phiên này; cần quy trình quầy xử lý ngay, không chốt từ xa.
4. Nhân viên nhận đủ tiền mặt thật, nhập đúng số tiền VND và xác nhận (`paid`). Backend lưu người xác nhận, thời gian, tiền.
5. Nhân viên kiểm tra xe rời khỏi vị trí rồi xác nhận (`closed`). Transaction giải phóng chỗ và kết thúc vé. Không có tự động mở cổng hoặc điều khiển thiết bị.
6. Khách xem lịch sử và số tiền được xác nhận. Không hoàn tiền hoặc điều chỉnh hóa đơn trong bản này: trường hợp bất thường cần quản lý xử lý có nhật ký và chính sách riêng.

Khi mất kết nối, không xác nhận trên app cho đến khi đồng bộ. Nhân viên cần quy trình xử lý thủ công an toàn, không dùng app làm hệ thống an toàn giao thông. Không chốt phí rồi để xe đỗ lâu. Không cho xe vào vị trí đặt trước khi xác nhận đúng vé; nếu hủy trước xác nhận thì phải kiểm tra lại trạng thái. Không sử dụng vị trí `free` như cảm biến vật lý, đây là trạng thái nghiệp vụ do nhân viên xác nhận.

## 8. Kiểm thử và giới hạn

`npm test` tại thư mục gốc: 8 unit test nghiệp vụ đã đạt. Expo Android JS bundle đã export thành công (không phải APK). Cú pháp các file backend đã kiểm tra. Môi trường đóng gói không truy cập được npm registry (`EAI_AGAIN`), chưa cài Express/Admin SDK mới và chưa chạy bài HTTP API hoặc kết nối Firebase thật. Chạy `npm install` và `npm test` trong server trên máy Windows; bài HTTP dùng stub chỉ trong kiểm thử, không phải chế độ demo của app.

Checklist nghiệm thu: 2 khách, 1 nhân viên; đặt trùng chỉ một thành công; khách không gọi thao tác nhân viên; khách không đọc vé của người khác; ghi trực tiếp Firestore bị chặn; chốt phí, nhận tiền, giải phóng chỗ; lỗi mạng, thử lại; kiểm tra vé hết hạn; xác minh đúng bãi xe thật. Không đưa vào khai thác thương mại trước khi xác nhận toàn bộ.

Không cần Blaze cho kiến trúc này nếu nằm trong hạn mức Spark. Firebase vẫn áp dụng quota, máy chủ/Internet/TLS/hosting có thể phát sinh chi phí nếu thuê ngoài. Laptop tắt hoặc ngắt mạng sẽ không xử lý giao dịch mới.
