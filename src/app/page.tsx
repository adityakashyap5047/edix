import Image from 'next/image'
import React from 'react'

const page = () => {
  return (
    <div>
      <Image src={"/vividly/vividly-text.png"} alt="Vividly Logo" width={200} height={200} className='h-4 w-30' />
    </div>
  )
}

export default page