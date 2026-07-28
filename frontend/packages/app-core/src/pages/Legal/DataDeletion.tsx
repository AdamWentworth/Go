import { Link } from 'react-router';

import LegalPage from './LegalPage';

const DataDeletion = () => (
  <LegalPage eyebrow="Account help" title="User Data Deletion" updated="July 28, 2026">
    <section>
      <h2>Delete your account in PokeGoNexus</h2>
      <ol>
        <li>Sign in to the PokeGoNexus account you want to delete.</li>
        <li>Open <Link to="/settings/account">Settings → Account Security</Link>.</li>
        <li>Select <strong>Delete account</strong> and confirm the request.</li>
      </ol>
      <p>
        This removes the sign-in account and initiates deletion of associated
        PokeGoNexus application data. Some limited records may remain temporarily
        in encrypted backups or where retention is required for security or law.
      </p>
    </section>
    <section>
      <h2>If you cannot sign in</h2>
      <p>
        Email <a href="mailto:admin@pokegonexus.com">admin@pokegonexus.com</a> from
        the address associated with the account. Include your PokeGoNexus username
        and state that you are requesting account and data deletion. Do not send a
        password, OAuth secret, or authentication code.
      </p>
    </section>
    <section>
      <h2>Remove Facebook access</h2>
      <p>
        Removing PokeGoNexus from Facebook&apos;s Apps and Websites settings stops
        future Facebook access. To delete information already stored by
        PokeGoNexus, also complete one of the deletion methods above.
      </p>
    </section>
  </LegalPage>
);

export default DataDeletion;
