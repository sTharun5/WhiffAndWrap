"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderStatusUpdateUser = exports.sendOrderAcceptedUser = exports.sendOrderPlacedAdmin = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendOrderPlacedAdmin = async (orderDetails) => {
    const itemsHtml = orderDetails.items
        .map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price.toFixed(2)}</td></tr>`)
        .join('');
    await transporter.sendMail({
        from: `"Whiff & Wrap" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Order Received - #${orderDetails.orderId.slice(0, 8)}`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#8B5CF6">🌸 Whiff & Wrap – New Order!</h2>
        <p><strong>Customer:</strong> ${orderDetails.userName} (${orderDetails.userEmail})</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
          <tr style="background:#f3f4f6"><th>Item</th><th>Qty</th><th>Price</th></tr>
          ${itemsHtml}
        </table>
        <p style="font-size:1.2em;margin-top:12px"><strong>Total: ₹${orderDetails.totalAmount.toFixed(2)}</strong></p>
        <p>Please review and accept this order in your <strong>Admin Dashboard</strong>.</p>
      </div>
    `,
    });
};
exports.sendOrderPlacedAdmin = sendOrderPlacedAdmin;
const sendOrderAcceptedUser = async (userEmail, userName, orderId, deliveryDate) => {
    await transporter.sendMail({
        from: `"Whiff & Wrap" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '🎁 Your Order Has Been Accepted!',
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#8B5CF6">🌸 Whiff & Wrap</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Great news! Your order <strong>#${orderId.slice(0, 8)}</strong> has been <strong style="color:green">accepted</strong>.</p>
        <p>Your estimated delivery date is: <strong>${deliveryDate}</strong></p>
        <p>We're now lovingly preparing your handmade gift. Stay tuned!</p>
        <p style="color:#888;font-size:0.9em">– Team Whiff & Wrap 🌸</p>
      </div>
    `,
    });
};
exports.sendOrderAcceptedUser = sendOrderAcceptedUser;
const sendOrderStatusUpdateUser = async (userEmail, userName, orderId, status) => {
    let subject = '';
    let message = '';
    const sid = orderId.slice(0, 8);
    switch (status) {
        case 'PREPARING':
            subject = '🎁 Preparing your handmade gift!';
            message = `Your order <strong>#${sid}</strong> is now being <strong style="color:#C9956A">prepared</strong> with love and care. We'll let you know once it's on its way!`;
            break;
        case 'OUT_FOR_DELIVERY':
            subject = '🚗 Your order is on its way!';
            message = `Hold tight! Your order <strong>#${sid}</strong> is now <strong style="color:#4A9B6F">out for delivery</strong>. Our delivery partner will reach you shortly.`;
            break;
        case 'DELIVERED':
            subject = '🏠 Delivered with Love!';
            message = `Your order <strong>#${sid}</strong> has been <strong style="color:#8B4A73">delivered</strong>! We hope it brings a smile to your face. Thank you for shopping with Whiff & Wrap!`;
            break;
        default: return;
    }
    await transporter.sendMail({
        from: `"Whiff & Wrap" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;padding:24px">
        <h2 style="color:#8B4A73">🌸 Whiff & Wrap</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>${message}</p>
        <p style="color:#888;font-size:0.9em;margin-top:20px">Warmly,<br>Team Whiff & Wrap 🌸</p>
      </div>
    `,
    });
};
exports.sendOrderStatusUpdateUser = sendOrderStatusUpdateUser;
