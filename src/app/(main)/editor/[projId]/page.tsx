
const page = async ({ params }: {params: Promise<{ projId: string }>}) => {

    const { projId } = await params;

    return (
        <div>Editing project {projId}</div>
    )
}

export default page