import React from 'react'
import UserAddressCard from '@/components/cnf-profile/UserAddressCard'
import UserMetaCard from '@/components/cnf-profile/UserMetaCard'
import UserInfocard from '@/components/cnf-profile/UserInfoCard'
import NomineeDetails from '@/components/cnf-profile/NomineeDetails'

export default function page() {
    return (
        <>
           
                <div className="space-y-3">
                    <UserMetaCard />
                    <UserInfocard />
                    <UserAddressCard />
                    <NomineeDetails />
                </div>
        </>
    )
}
