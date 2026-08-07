import { ModeToggle } from '@/components/mode-toggle';
import {  Show, SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="text-2xl font-bold text-center mt-10 text-blue-400">
      <h1>My App</h1>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </div>
  );
}
