// src/pages/api/contact.ts
import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const service = formData.get('service')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    // Enhanced validation
    const errors: string[] = [];

    // Name validation
    if (!name || name.trim().length < 2) {
      errors.push('Nama minimal 2 karakter');
    } else if (name.trim().length > 100) {
      errors.push('Nama maksimal 100 karakter');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('Format email tidak valid');
    }

    // Service validation
    const validServices = [
      'School Website',
      'News Portal',
      'Company Profile',
      'Lainnya',
    ];
    if (!service || !validServices.includes(service)) {
      errors.push('Layanan tidak valid');
    }

    // Message validation
    if (!message || message.trim().length < 10) {
      errors.push('Pesan minimal 10 karakter');
    } else if (message.trim().length > 2000) {
      errors.push('Pesan maksimal 2000 karakter');
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: errors.join('. '),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedService = service.trim();
    const sanitizedMessage = message.trim();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: import.meta.env.EMAIL_HOST,
      port: parseInt(import.meta.env.EMAIL_PORT || '587'),
      secure: import.meta.env.EMAIL_SECURE === 'true',
      auth: {
        user: import.meta.env.EMAIL_USER,
        pass: import.meta.env.EMAIL_PASS,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Konfigurasi email tidak valid. Silakan hubungi administrator.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Prepare email content
    const emailSubject = `Pesan Kontak Baru: ${service}`;
    const emailText = `
Nama: ${name}
Email: ${email}
Layanan: ${service}
Pesan: ${message}
    `.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesan Kontak Baru - JasaWeb</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .field {
            margin-bottom: 15px;
        }
        .field-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }
        .field-value {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            border-left: 4px solid #2563eb;
        }
        .message {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #2563eb;
            white-space: pre-wrap;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .service-badge {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Pesan Kontak Baru</h1>
            <p>Lead baru dari website JasaWeb</p>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="field-label">Nama Lengkap:</div>
                <div class="field-value">${name}</div>
            </div>
            
            <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value">
                    <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
                </div>
            </div>
            
            <div class="field">
                <div class="field-label">Layanan yang Diminati:</div>
                <div class="field-value">
                    <span class="service-badge">${service}</span>
                </div>
            </div>
            
            <div class="field">
                <div class="field-label">Pesan:</div>
                <div class="message">${message.replace(/\n/g, '<br>')}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim melalui form kontak website JasaWeb</p>
            <p style="font-size: 12px;">Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Send email
    try {
      await transporter.sendMail({
        from: `"${import.meta.env.EMAIL_FROM_NAME || 'JasaWeb Team'}" <${import.meta.env.EMAIL_USER}>`,
        replyTo: `"${sanitizedName}" <${sanitizedEmail}>`,
        to: import.meta.env.CONTACT_EMAIL,
        subject: emailSubject,
        text: emailText
          .replace(/\${name}/g, sanitizedName)
          .replace(/\${email}/g, sanitizedEmail)
          .replace(/\${service}/g, sanitizedService)
          .replace(/\${message}/g, sanitizedMessage),
        html: emailHtml
          .replace(/\${name}/g, sanitizedName)
          .replace(/\${email}/g, sanitizedEmail)
          .replace(/\${service}/g, sanitizedService)
          .replace(/\${message}/g, sanitizedMessage),
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gagal mengirim email. Silakan coba lagi nanti.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Pesan Anda telah berhasil dikirim. Kami akan segera menghubungi Anda.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Error processing contact form - handled gracefully

    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
