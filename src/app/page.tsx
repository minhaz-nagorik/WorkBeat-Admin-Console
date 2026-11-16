import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/overview'); // the (app) layout sends staff to their own landing page
}
