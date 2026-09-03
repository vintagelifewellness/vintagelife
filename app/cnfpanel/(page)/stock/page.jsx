'use client'

import React from 'react'
import CnfStock from '@/components/CnfStockforuser'
import { useSession } from "next-auth/react"

export default function page() {
    const { data: session, status } = useSession()
    const currentDsid = session?.user?.dscode;

    return (
        <div>
            <CnfStock dscode={currentDsid} />
        </div>
    )
}
