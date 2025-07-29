// app/layout.js
import '../styles/globals.css'
import GlobalLoading from '../components/globalLoading/globalLoading';

export const metadata = {
  title: 'My App',
  description: 'Description here',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <GlobalLoading />
        {children}
      </body>
    </html>
  );
}
