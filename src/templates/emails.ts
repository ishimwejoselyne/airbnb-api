const brand = "#FF5A5F";

function layout(title: string, content: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.5">
    <h2 style="color:${brand};margin-bottom:8px">${title}</h2>
    <div>${content}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <div style="color:#666;font-size:12px">Airbnb API (learning project)</div>
  </div>`;
}

function button(text: string, href: string) {
  return `
    <a href="${href}" style="display:inline-block;background:${brand};color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">
      ${text}
    </a>
  `;
}

export function welcomeEmail(name: string, role: string): string {
  const tip =
    role === "HOST"
      ? "Create your first listing and start hosting today."
      : "Explore listings and book your next stay.";

  return layout(
    `Welcome, ${name}!`,
    `
      <p>Thanks for joining our Airbnb API.</p>
      <p><strong>Your role:</strong> ${role}</p>
      <p>${tip}</p>
    `
  );
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string {
  return layout(
    "Booking confirmed",
    `
      <p>Hi ${guestName}, your booking was created successfully.</p>
      <p><strong>${listingTitle}</strong> — ${location}</p>
      <ul>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
        <li><strong>Total:</strong> $${totalPrice.toFixed(2)}</li>
      </ul>
      <p style="color:#666">Note: cancellation policies may apply.</p>
    `
  );
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string {
  return layout(
    "Booking cancelled",
    `
      <p>Hi ${guestName}, your booking has been cancelled.</p>
      <p><strong>${listingTitle}</strong></p>
      <ul>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
      </ul>
      <p>You can browse other listings anytime.</p>
    `
  );
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return layout(
    "Reset your password",
    `
      <p>Hi ${name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <p>${button("Reset password", resetLink)}</p>
      <p style="color:#666">If you did not request this, ignore this email.</p>
    `
  );
}

