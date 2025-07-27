"use client";

import useFetch from "@/hooks/useFetch";
import { useEffect } from "react";

const Page = () => {

    const {
        data: projects,
        loading,
        error,
        fn: refetch
    } = useFetch({
        endpoint: "/api/projects",
    });

    useEffect(() => {
        refetch();
    }, [refetch]);

    return (
        <div>
            <div>
                <div>
                    <div>
                        <h1>
                            Your Projects
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page