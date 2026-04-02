# WeChat pay QR image

Put your WeChat payment QR image in this folder with the exact filename:

- `wechat-pay-qr.png`

Expected public URL used by the app:

- `/images/payments/wechat-pay-qr.png`

Current payment-page behavior:

- The frontend treats this image as the WeChat payment channel when the app is using manual QR payment.
- After the customer scans and pays, they can click “我已完成支付” on the payment page to notify the platform.
- If the image is missing, the payment page will remind you to place it in this folder.
