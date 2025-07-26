const layout = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex min-h-main pt-16 justify-center items-center">{children}</div>
  )
}

export default layout