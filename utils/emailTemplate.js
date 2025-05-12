const emailTemplate = ({
  action,
  donation,
  organizationName,
  project,
  reasonForRejection,
  formatDonationValue,
}) => {
  console.log(action, donation, organizationName);
  const greeting =
    action === "confirm" || action === "correct"
      ? `Cảm ơn bạn đã đồng hành cùng ${organizationName}. Thông tin ủng hộ của bạn như sau:`
      : `${organizationName} rất tiếc thông báo rằng ủng hộ của bạn đã bị từ chối với lý do: ${reasonForRejection}. Dưới đây là thông tin đăng ký ủng họ của bạn:`;
  const donationInfo =
    action === "confirm" || action === "correct"
      ? `
    <ul>
      <li>Dự án: ${project.title}</li>
      <li> Đăng ký ủng hộ: ${formatDonationValue(
        donation,
        donation.registered
      )}</li>
      <li>
         Đã nhận được: ${formatDonationValue(donation, donation.raised)}
      </li>
      <li>Thời gian: ${donation.createdAt.toLocaleString()}</li>
    </ul>
  `
      : `<ul>
      <li>Dự án: ${project.title}</li>
      <li> Đăng ký ủng hộ: ${formatDonationValue(
        donation,
        donation.registered
      )}</li>
      <li>Thời gian: ${donation.createdAt.toLocaleString()}</li>
    </ul>`;
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    
  </head>
  <body>
    <div style="font-size: 16px; color: black">
      <div style="color: #084c1a, font-weight: bold, font-size: 20px"><img src="cid:logo" alt="Donation Team" style="display: inline-block; width: 50px; height: 20px;"/> DONATION</div>
      <p>Xin chào ${donation.donorName}</p>
      <p>${greeting}</p>
      ${donationInfo}
      <p>
        Bạn có thể ủng hộ thêm các dự án khác <a href="http://localhost:3000/projects">tại đây</a>.
      </p>
      <p>Chúc bạn hạnh phúc và thành công!</p>
      <p>Donation Team.</p>
    </div>
    </body>
    </html>
  `;
};

module.exports = { emailTemplate };
//
