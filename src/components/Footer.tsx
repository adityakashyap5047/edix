"use client";

import { usePathname } from 'next/navigation'

const Footer = () => {

  const pathName = usePathname();

  if (pathName.includes("/editor")) {
        return null;
    }

  return (
    <div className='bg-slate-800 flex justify-center items-center h-20 '>Made With ❤️ by Vividly</div>
  )
}

export default Footer