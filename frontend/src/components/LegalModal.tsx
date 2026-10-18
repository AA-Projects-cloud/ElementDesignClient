import React from 'react';
import { X } from 'lucide-react';

export type LegalDoc = 'terms' | 'privacy';

interface Section {
  title: string;
  body: string[];
}

const UPDATED = 'October 2026';

const TERMS: Section[] = [
  {
    title: '1. About these terms',
    body: [
      'These Terms & Conditions govern your use of the Element Design application, a private portal where our team shares drawings, images, videos, documents and site progress updates with our customers. By creating an account or signing in, you agree to these terms.',
      'If you have signed a project contract with Element Design, the contract takes priority wherever it differs from these terms.',
    ],
  },
  {
    title: '2. Accounts',
    body: [
      'Give us accurate details when you register, including a working email address and mobile number, and keep them up to date.',
      'You are responsible for keeping your password confidential and for everything done through your account. Tell us straight away if you think someone else has used it.',
      'Customer accounts show only the work for your own project. Administrator access is limited to authorised Element Design staff and must not be shared or attempted without permission.',
    ],
  },
  {
    title: '3. What the application provides',
    body: [
      'You can view and download the drawings, images, videos, documents and site updates that Element Design has published to your project, acknowledge receipt of drawings, and request a call back from our team.',
      'You will receive an email at your registered address when new work is published for you.',
      'Files shared through the application are the versions released by Element Design. Always use the latest revision shown for construction or purchase decisions.',
    ],
  },
  {
    title: '4. Acceptable use',
    body: [
      'You agree not to: try to view or change information that belongs to another customer; attempt to bypass or test the security of the application; upload harmful, unlawful or infringing material; copy or scrape the application; or use it for any purpose other than managing your own project with Element Design.',
      'We may suspend or remove access if these rules are broken or if we need to protect other users or the service.',
    ],
  },
  {
    title: '5. Ownership of designs and files',
    body: [
      'Drawings, designs, plans and related materials remain the intellectual property of Element Design and its designers unless your contract says otherwise.',
      'You may view and download materials for your own project. You may not share, publish, copy or reuse them for another project or for anyone else without our written permission.',
    ],
  },
  {
    title: '6. Confidentiality',
    body: [
      'Material in your account may include private information about your property. Please keep it confidential and do not share your login with others.',
    ],
  },
  {
    title: '7. Availability and file limits',
    body: [
      'We work to keep the application available, but we do not promise it will always be uninterrupted or error-free, and we may update or pause it for maintenance.',
      'Uploads are limited to PDF, image and video files of up to 50 MB each.',
    ],
  },
  {
    title: '8. Limitation of liability',
    body: [
      'The application is provided on an "as is" basis. To the extent the law allows, Element Design is not liable for indirect or consequential loss arising from use of, or inability to use, the application, or for delays caused by events outside our control.',
      'Nothing in these terms limits any liability that cannot be limited by law.',
    ],
  },
  {
    title: '9. Ending access',
    body: [
      'You may stop using the application at any time. We may close or suspend an account when a project ends, when these terms are broken, or where required by law.',
    ],
  },
  {
    title: '10. Changes and governing law',
    body: [
      'We may update these terms from time to time. The latest version is always available on the sign-in page, and continued use means you accept the changes.',
      'These terms are governed by the laws of India.',
    ],
  },
  {
    title: '11. Contact',
    body: ['For any question about these terms, please contact the Element Design team through your project administrator.'],
  },
];

const PRIVACY: Section[] = [
  {
    title: '1. Who we are',
    body: [
      'Element Design ("we", "us") runs this application to share project work with customers. This policy explains what personal information we collect, why, and how we protect it.',
    ],
  },
  {
    title: '2. Information we collect',
    body: [
      'Account details: your name, email address, mobile number (customers) and a password. Your password is stored only in protected form, so no one at Element Design can read it.',
      'Project information: your project name, type, location, size, stage and progress, and the drawings, images, videos, documents and site updates we upload for you.',
      'Activity records: actions such as signing in, uploading, downloading, approving site updates and requesting a call, kept as a record of who did what and when.',
      'Call requests: the preferred time and topic you give us, together with your name and mobile number so our team can reach you.',
    ],
  },
  {
    title: '3. How we use it',
    body: [
      'To create and manage your account and show you your own project.',
      'To publish work to you and to email you when new updates are available.',
      'To contact you about your project and respond to call requests.',
      'To keep the application secure, prevent misuse, and keep an accurate record of activity.',
    ],
  },
  {
    title: '4. Who can see your information',
    body: [
      'Your project files and details are visible to you and to authorised Element Design staff. Other customers cannot see them.',
      'We do not sell your personal information or use it for advertising.',
    ],
  },
  {
    title: '5. Service providers',
    body: [
      'We use trusted third-party providers to run the application: secure cloud hosting and file storage, account sign-in, and email delivery. They handle your information only to provide these services for us.',
      'We may also disclose information where the law requires it or to protect our rights and the safety of others.',
    ],
  },
  {
    title: '6. Emails',
    body: [
      'We send emails about your project, such as a notice that new work has been published. These are service messages, not marketing. You can reply to them to reach the team member who sent them.',
    ],
  },
  {
    title: '7. How we protect your information',
    body: [
      'Files are kept in private storage and are only opened through short-lived secure links. Access is restricted so each customer sees only their own project, and connections to the application are encrypted.',
      'No system is completely secure, so please choose a strong password, keep it private and sign out on shared devices.',
    ],
  },
  {
    title: '8. How long we keep it',
    body: [
      'We keep your information while your account and project are active and for as long afterwards as we need it for project records, legal and accounting purposes, after which it is deleted or anonymised.',
    ],
  },
  {
    title: '9. Your choices',
    body: [
      'You can ask us to show you the information we hold about you, correct it, or delete it where we are not required to keep it. Please contact the Element Design team to make a request.',
    ],
  },
  {
    title: '10. Children',
    body: ['The application is for adults and is not intended for anyone under 18.'],
  },
  {
    title: '11. Changes to this policy',
    body: [
      'We may update this policy from time to time. The latest version is always available on the sign-in page.',
    ],
  },
];

const DOCS: Record<LegalDoc, { eyebrow: string; title: string; sections: Section[] }> = {
  terms: { eyebrow: 'LEGAL', title: 'Terms & Conditions', sections: TERMS },
  privacy: { eyebrow: 'LEGAL', title: 'Privacy Policy', sections: PRIVACY },
};

interface LegalModalProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ doc, onClose }) => {
  if (!doc) return null;
  const { eyebrow, title, sections } = DOCS[doc];

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">{eyebrow}</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>{title}</h3>
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
            Last updated: {UPDATED}
          </span>
          {sections.map((s) => (
            <div key={s.title}>
              <h4 style={{ fontSize: 13, marginBottom: 6 }}>{s.title}</h4>
              {s.body.map((p, i) => (
                <p key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-secondary)', marginBottom: 6 }}>
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
