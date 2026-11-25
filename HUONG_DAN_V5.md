# Smart Parking Hub V5 — nâng cấp từ V4 (không cần Blaze)

Gói cập nhật này chỉ chứa tệp thay đổi, không phải dự án độc lập. Sao lưu thư mục D:\SmartParkingHub trước khi giải nén đè các tệp vào đó. Giữ nguyên src/services/firebaseConfig.js, .env, node_modules, package-lock.json và khóa Firebase ở D:\private. Không seed lại dữ liệu. Không chạy V4 và V5 đồng thời. Các vé V4 chưa hoàn thành vẫn xử lý theo luồng tiền mặt cũ.

## Triển khai trên Windows
1. Dừng Expo và Node bằng Ctrl+C ở hai cửa sổ. Giải nén bản cập nhật vào thư mục gốc dự án sao cho App.js cùng cấp server và src.
2. Từ CMD:
   ```cmd
   cd /d D:\SmartParkingHub
   firebase deploy --only firestore:rules --project smart-parking-hub
   node --test server/domain.test.cjs server/wallet.test.cjs
   cd server
   set "GOOGLE_APPLICATION_CREDENTIALS=D:\private\smart-parking-hub-admin.json"
   set "FIREBASE_PROJECT_ID=smart-parking-hub"
   npm start
   ```
   Nếu có chỉnh sửa Firestore Rules sau V4, hợp nhất thêm hai collection mới thay vì ghi đè quy tắc khác. Không deploy Functions. Không cần thư viện mới.
3. CMD khác: `cd /d D:\SmartParkingHub` rồi `npx expo start --clear`. Giữ địa chỉ EXPO_PUBLIC_API_URL hiện có nếu IP Wi-Fi không đổi. Kiểm tra /health trên điện thoại. HTTP LAN chỉ để kiểm thử, không dùng với tài khoản thật của khách hàng qua mạng công cộng; triển khai HTTPS trước khi vận hành.
4. Tạo hai tài khoản thật bằng app hoặc Firebase Authentication: khách hàng và nhân viên. Từ CMD backend (mở CMD khác nếu server đang chạy, đặt lại hai biến môi trường): `node setup.cjs smart-parking-hub staff EMAIL_NHAN_VIEN`. Thay EMAIL_NHAN_VIEN bằng email đã đăng ký, đăng xuất rồi đăng nhập lại tài khoản nhân viên để tải claims. Không cấp staff cho khách hàng. Không chia sẻ private key.

## Nghiệp vụ mới
- Tài khoản: tên, điện thoại, email, biển số, quyền, số dư. Số dư mới = 0; hồ sơ V4 thiếu trường balanceVnd tự được bổ sung 0 khi init, không sửa số dư đã tồn tại.
- Nạp tiền tại quầy: khách tạo yêu cầu 10.000–5.000.000 đ, tối đa một yêu cầu chờ. Nhân viên nhận tiền mặt thật và nhập đúng số tiền để xác nhận. Không tự xác nhận cho mình; không tự cộng tiền khi khách gửi yêu cầu. Không dùng ví này để chuyển tiền/rút tiền. Đây là sổ số dư trả trước nội bộ cho dịch vụ đỗ xe, chưa có cổng ngân hàng và chưa có quy trình hoàn tiền tự động. Phải có chính sách hoàn trả, đối soát, xử lý tranh chấp trước khi thu tiền thật rộng rãi.
- Đặt chỗ: trừ trước giá một giờ; khóa vị trí và tạo vé ngay trong một transaction. Phí bắt đầu tại thời điểm đặt (server). Không tự hết hạn vì thời gian giữ chỗ cũng được tính phí; khách phải yêu cầu trả chỗ nếu không đến. Xác nhận xe vào không đặt lại thời gian.
- Trả chỗ: khách yêu cầu trả, nhân viên xác nhận vị trí thực tế trống; backend tính phí đến lúc xác nhận, tối thiểu một giờ và làm tròn lên từng giờ, tự trừ phần chênh lệch. Nếu thiếu số dư, yêu cầu nạp thêm, chỗ vẫn được khóa và phí tiếp tục tính đến lúc quyết toán thành công. Ví dụ 10.000 đ/giờ, đặt 14:00, trả và xác nhận 15:20 => 20.000 đ tổng, 10.000 đ đã trừ lúc đặt và 10.000 đ trừ thêm lúc trả.
- Mọi giao dịch tiền được ghi sổ sp_wallet_events; yêu cầu nạp sp_topups; số dư sp_users.balanceVnd. Client chỉ đọc; Admin SDK thực hiện mọi ghi qua API kiểm tra token. Không sửa balanceVnd trực tiếp trong Firebase Console. Dùng đúng quyền quản lý, kiểm soát tiền mặt và đối soát trước khi mở cửa cho khách.
- Các chức năng đặt chỗ tiền trả trước, sổ số dư, duyệt nạp tiền chưa được kiểm thử với Firebase thực tế trong môi trường tạo bản cập nhật. 17 test Node kiểm thử logic và transaction double, không chứng minh concurrency Firestore thật. Cần nghiệm thu hai tài khoản và hai thiết bị, thử đồng thời đặt cùng chỗ, lặp thao tác, mất mạng, thiếu tiền, xác minh rules trên Firebase. Không có camera/cảm biến/barrier hoặc thanh toán ngân hàng.

## GitHub
Sau khi thử xong, `git add App.js firestore.rules server/parkingAction.cjs server/wallet.cjs server/wallet.test.cjs src/contexts/AuthContext.js src/services/parkingService.js src/screens/AboutScreen.js src/screens/HistoryScreen.js src/screens/HomeScreen.js src/screens/ProfileScreen.js src/screens/StaffScreen.js src/screens/WalletScreen.js HUONG_DAN_V5.md`, `git status`, `git commit -m "Add prepaid parking and personal wallet"`, `git push origin main`. Không commit khóa Admin, .env, thông tin tiền mặt của khách hoặc node_modules.
