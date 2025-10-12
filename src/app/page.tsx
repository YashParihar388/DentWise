import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignOutButton, SignUp, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <>
    <SignedOut>
      <SignUpButton mode='modal'>Sign up</SignUpButton>
    </SignedOut>
    
    <SignedIn>
        <SignOutButton></SignOutButton>
    </SignedIn>
      </>
  );
}
