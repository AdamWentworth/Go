const { buildEmailChangeEmail } = require('../services/emailChangeService');

describe('email change email service', () => {
  test('renders a clear verification action and safe escaped content', () => {
    const content = buildEmailChangeEmail({
      username: '<Adam>',
      newEmail: 'new@example.com',
      verifyUrl: 'https://pokegonexus.com/verify-email-change?token=abc&next=1'
    });

    expect(content.subject).toContain('Confirm');
    expect(content.text).toContain('new@example.com');
    expect(content.text).toContain('expires in 30 minutes');
    expect(content.html).toContain('Confirm new email');
    expect(content.html).toContain('&lt;Adam&gt;');
    expect(content.html).not.toContain('<Adam>');
  });
});
