import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderPlacedAdmin = async (orderDetails: {
  orderId: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  items: { name: string; quantity: number; price: number; image?: string }[];
  totalAmount: number;
}) => {
  const itemsHtml = orderDetails.items
    .map(i => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee">
          ${i.image ? `<img src="${i.image}" alt="${i.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:10px;vertical-align:middle">` : ''}
          <span style="vertical-align:middle">${i.name}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">₹${i.price.toFixed(2)}</td>
      </tr>
    `)
    .join('');

  await transporter.sendMail({
    from: `"Whiff & Wrap" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Order Received - #${orderDetails.orderId.slice(0, 8)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:20px;border-radius:12px">
        <h2 style="color:#8B5CF6;text-align:center">🌸 New Order Received!</h2>
        <hr style="border:0;border-top:1px solid #eee;margin:20px 0">
        <p><strong>Customer:</strong> ${orderDetails.userName} (${orderDetails.userEmail})</p>
        <p><strong>Phone Number:</strong> <a href="tel:${orderDetails.phoneNumber}" style="color:#8B5CF6;text-decoration:none">${orderDetails.phoneNumber}</a></p>
        <p><strong>Order ID:</strong> #${orderDetails.orderId}</p>
        
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <tr style="background:#f9fafb">
            <th style="padding:10px;text-align:left">Item</th>
            <th style="padding:10px;text-align:center">Qty</th>
            <th style="padding:10px;text-align:right">Price</th>
          </tr>
          ${itemsHtml}
        </table>
        
        <div style="text-align:right;margin-top:20px;padding-top:10px;border-top:2px solid #eee">
          <p style="font-size:1.2em;margin:0"><strong>Total Amount: ₹${orderDetails.totalAmount.toFixed(2)}</strong></p>
        </div>
        
        <div style="text-align:center;margin-top:30px">
          <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}" style="background:#8B5CF6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">View in Dashboard</a>
        </div>
      </div>
    `,
  });
};

export const sendOrderAcceptedUser = async (userEmail: string, userName: string, orderId: string, deliveryDate: string) => {
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

export const sendOrderStatusUpdateUser = async (userEmail: string, userName: string, orderId: string, status: string) => {
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

export const sendOrderRejectedUser = async (userEmail: string, userName: string, orderId: string, reason: string) => {
  await transporter.sendMail({
    from: `"Whiff & Wrap" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Update Regarding Your Order - Whiff & Wrap',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;padding:24px">
        <h2 style="color:#C0392B">Whiff & Wrap</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>We're writing to let you know that your order <strong>#${orderId.slice(0, 8)}</strong> could not be accepted at this time.</p>
        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #C0392B">
          <p style="margin:0;font-style:italic"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Your payment (if any) will be refunded to your original payment method within 5-7 business days.</p>
        <p>We apologize for any inconvenience caused and hope you'll visit us again soon.</p>
        <p style="color:#888;font-size:0.9em;margin-top:20px">Warmly,<br>Team Whiff & Wrap 🌸</p>
      </div>
    `,
  });
};
