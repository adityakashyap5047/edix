"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { useEffect } from 'react';
import axios from 'axios';
import { BarLoader } from 'react-spinners';
import { LayoutDashboard } from 'lucide-react';

const Header = () => {

    const pathName = usePathname();
    const { isSignedIn, isLoaded } = useUser();

    useEffect(() => {
        if (!isSignedIn) return;
        const user = async () => {
            try {
                await axios.post("/api/users");
            } catch (error) {
                console.error("Error adding user:", error);
            }
        }
        user();
    }, [isSignedIn]);

    if (pathName.includes("/editor")) {
        return null;
    }

    return (
        <header className='fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-nowrap'>
            <div className='backdrop-blur-md bg-slate-900/10 border border-white/20 rounded-full px-8 py-3 flex items-center justify-between gap-8'>
                <Link href="/" className='mr-10 md:mr-20'>
                    <Image src={"/edix/edix.png"} alt="Edix Logo" width={200} height={50} className='h-8 w-8'/>
                </Link>
                {
                    pathName === '/' && (
                        <div className='hidden md:flex space-x-6'>
                            <Link 
                                href={"/#features"}
                                className='text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'
                            >
                                Features
                            </Link>
                            <Link 
                                href={"/#pricing"}
                                className='text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'
                            >
                                Pricing
                            </Link>
                            <Link 
                                href={"/#contact"}
                                className='text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'
                            >
                                Contact
                            </Link>
                        </div>
                    )
                }
                <div className='flex items-center gap-3 ml-10 md:ml-20'>
                    <SignedOut>
                        <SignInButton>
                            <Button variant={"glass"} className='hidden sm:flex'>
                                Sign In
                            </Button>
                        </SignInButton>
                        <SignUpButton>
                            <Button variant={"primary"}>Get Started</Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Link href={"/dashboard"}>
                            <Button variant={"glass"}>
                                <LayoutDashboard className='h-4 w-4' />
                                <span className='hidden md:flex'>DashBoard</span>
                            </Button>
                        </Link>
                        <UserButton appearance={{
                            elements: {
                                avatarBox: "w-8 h-8",
                            }
                        }} />
                    </SignedIn>
                </div>
            </div>
            {!isLoaded && (
                <div className='fixed bottom-0 left-0 w-full z-40 flex justify-center'>
                    <BarLoader height={2} width={"90%"} color='#06b6d4'/>
                </div>
            )}
        </header>
    )
}

export default Header