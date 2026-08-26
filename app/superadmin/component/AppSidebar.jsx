"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useSidebar } from '@/app/context/SidebarContext';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
    Users, FileText, CheckSquare, CreditCard, 
    ShieldCheck, BarChart, ShoppingCart, History, 
    Calculator, Wallet, Network, Award, 
    Box, ImageIcon, KeyRound, ChevronDown, UserCog, Search // 🚀 Added Search icon
} from "lucide-react"; 

// ... (Keep your exact same navItems array here) ...
const navItems = [
    { icon: <UserCog size={20} />, name: "Admin Panel", path: "/superadmin/panel" },
    {
        icon: <Users size={20} />,
        name: "User Profile",
        subItems: [
            { name: "Active User ID", path: "/superadmin/Userprofile/activeuser" },
            { name: "DeActive User ID", path: "/superadmin/Userprofile/deactiveuser" },
            { name: "Suspend User ID", path: "/superadmin/Userprofile/susspenduser" },
            { name: "Level Achievers", path: "/superadmin/Userprofile/levelachivers" },
            { name: "All User", path: "/superadmin/Userprofile/user" },
        ],
    },
    {
        icon: <CheckSquare size={20} />,
        name: "C & F",
        subItems: [
            { name: "Active Registration", path: "/superadmin/C&F/activeregistration" },
            { name: "Pending Registration", path: "/superadmin/C&F/pendingregistration" },
            { name: "Approved Orders", path: "/superadmin/C&F/approvedorders" },
            { name: "Pending Orders", path: "/superadmin/C&F/pendingorder" },
            { name: "Demands", path: "/superadmin/C&F/demands" },
        ],
    },
    {
        icon: <CreditCard size={20} />,
        name: "Bank Kyc",
        subItems: [
            { name: "Pending", path: "/superadmin/BankKyc/pending" },
            { name: "Approved", path: "/superadmin/BankKyc/approved" },
            { name: "Rejected", path: "/superadmin/BankKyc/rejected" },
        ],
    },
    {
        icon: <FileText size={20} />,
        name: "Pan Card Kyc",
        subItems: [
            { name: "Pending", path: "/superadmin/panKyc/pending" },
            { name: "Approved", path: "/superadmin/panKyc/approved" },
            { name: "Rejected", path: "/superadmin/panKyc/rejected" },
        ],
    },
    {
        icon: <ShieldCheck size={20} />,
        name: "Aadhar Kyc",
        subItems: [
            { name: "Pending", path: "/superadmin/aadharkyc/pending" },
            { name: "Approved", path: "/superadmin/aadharkyc/approved" },
            { name: "Rejected", path: "/superadmin/aadharkyc/rejected" },
        ],
    },
    {
        icon: <BarChart size={20} />,
        name: "Report",
        subItems: [
            { name: "User Report", path: "/superadmin/Report/UserReport" },
        ],
    },
    {
        icon: <ShoppingCart size={20} />,
        name: "Orders",
        subItems: [
            { name: "Approved", path: "/superadmin/order/approvedorder" },
            { name: "Pending", path: "/superadmin/order/pendingdorder" },
            { name: "Recycle Bin", path: "/superadmin/Recyclebin" },
        ],
    },
    {
        icon: <History size={20} />,
        name: "Payment History",
        subItems: [
            { name: "Payment History", path: "/superadmin/Paymenthistory" },
        ],
    },
    {
        icon: <Calculator size={20} />,
        name: "Closing",
        subItems: [
            { name: "Pair Income Closing", path: "/superadmin/closing/pair" },
            { name: "Monthly Closing", path: "/superadmin/closing/monthly" },
            { name: "Travel Fund Closing", path: "/superadmin/closing/travel" },
            { name: "Bonanza Closing", path: "/superadmin/closing/bonanza" },
            { name: "C&F Closing", path: "/superadmin/closing/C&F-Monthly" },
        ],
    },
    {
        icon: <Wallet size={20} />,
        name: "Pair Withdrawal",
        subItems: [
            { name: "Pending", path: "/superadmin/withdrawal/pending" },
            { name: "Success", path: "/superadmin/withdrawal/success" },
            { name: "Invalid", path: "/superadmin/withdrawal/invalid" },
        ],
    },
    {
        icon: <Wallet size={20} />,
        name: "Monthly Withdrawal",
        subItems: [
            { name: "Pending", path: "/superadmin/withdrawal/month/pending" },
            { name: "Success", path: "/superadmin/withdrawal/month/success" },
            { name: "Invalid", path: "/superadmin/withdrawal/month/invalid" },
        ],
    },
    {
        icon: <Wallet size={20} />,
        name: "Travel Fund Withdrawal",
        subItems: [
            { name: "Pending", path: "/superadmin/withdrawal/travel/pending" },
            { name: "Success", path: "/superadmin/withdrawal/travel/success" },
            { name: "Invalid", path: "/superadmin/withdrawal/travel/invalid" },
        ],
    },
    {
        icon: <Wallet size={20} />,
        name: "C&F Withdrawal",
        subItems: [
            { name: "Pending", path: "/superadmin/C&F-Withdrawal/pending" },
            { name: "Success", path: "/superadmin/C&F-Withdrawal/success" },
        ],
    },
    {
        icon: <Network size={20} />,
        name: "Genealogy",
        subItems: [
            { name: "Sales Team", path: "/superadmin/Genealogy/salesteam" },
            { name: "Direct DS Code", path: "/superadmin/Genealogy/directds" },
        ],
    },
    {
        icon: <Award size={20} />,
        name: "Level",
        subItems: [
            { name: "All Level", path: "/superadmin/Level/all" },
            { name: "Update User", path: "/superadmin/Level/updateuser" },
        ],
    },
    {
        icon: <Award size={20} />,
        name: "Bonanza",
        subItems: [
            { name: "Bonanza", path: "/superadmin/Bonanza/3MonthsBonanza" },
        ],
    },
    {
        icon: <Box size={20} />,
        name: "Product Form",
        subItems: [
            { name: "Add Product", path: "/superadmin/Product/addproduct" },
            { name: "All Product", path: "/superadmin/Product/allproduct" },
        ],
    },
    {
        icon: <Award size={20} />,
        name: "Achivers",
        subItems: [
            { name: "Add Achivers", path: "/superadmin/Achivers/add" },
            { name: "All Achivers", path: "/superadmin/Achivers/all" },
        ],
    },
    { icon: <ImageIcon size={20} />, name: "Dashboard Image", path: "/superadmin/dashboardimage" },
    { icon: <KeyRound size={20} />, name: "Change Password", path: "/superadmin/ChangePassword" },
];

const AppSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // 🚀 NEW: Search state

    const handleLinkClick = () => {
        if (isMobileOpen) setIsMobileOpen(false);
    };

    const isActive = useCallback((path) => path === pathname, [pathname]);

    const isParentActive = useCallback((subItems) => {
        return subItems?.some((sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'));
    }, [pathname]);

    const handleSubmenuToggle = (index, menuType) => {
        setOpenSubmenu((prev) =>
            prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
        );
    };

    // 🚀 NEW: Smart deep-filtering logic
    const filteredNavItems = useMemo(() => {
        if (!searchTerm) return navItems;

        const lowercasedTerm = searchTerm.toLowerCase();

        return navItems.map(item => {
            // If it has sub-items, check both parent name and children names
            if (item.subItems) {
                const parentMatches = item.name.toLowerCase().includes(lowercasedTerm);
                const filteredSubItems = item.subItems.filter(sub => 
                    sub.name.toLowerCase().includes(lowercasedTerm)
                );

                if (parentMatches) {
                    return item; // Keep all children if parent name matches
                } else if (filteredSubItems.length > 0) {
                    return { ...item, subItems: filteredSubItems }; // Keep only matching children
                }
                return null; // Drop if nothing matches
            } 
            // If it's a direct link, just check the name
            else {
                return item.name.toLowerCase().includes(lowercasedTerm) ? item : null;
            }
        }).filter(Boolean); // Remove null values
    }, [searchTerm]);

    const renderMenuItems = (items, menuType) => (
        <ul className="flex flex-col gap-3">
            {items.map((nav, index) => {
                const isSubActive = isParentActive(nav.subItems);
                
                // 🚀 If searching, automatically open the submenus that match
                const isSubmenuOpen = searchTerm.length > 0 
                    ? true 
                    : (openSubmenu?.type === menuType && openSubmenu?.index === index);

                return (
                    <li key={nav.name}>
                        {nav.subItems ? (
                            <>
                                <button
                                    onClick={() => {
                                        if (isExpanded || isHovered) {
                                            handleSubmenuToggle(index, menuType);
                                        }
                                    }}
                                    className={`w-full flex items-center menu-item group rounded-md p-2 transition-colors ${
                                        isSubActive || isSubmenuOpen
                                            ? "bgg textn font-semibold"
                                            : "hbgb"
                                    } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                                >
                                    <span className="shrink-0">{nav.icon}</span>
                                    
                                    {(isExpanded || isHovered || isMobileOpen) && (
                                        <span className="menu-item-text ml-3 text-left whitespace-nowrap">{nav.name}</span>
                                    )}
                                    
                                    {(isExpanded || isHovered || isMobileOpen) && (
                                        <ChevronDown
                                            className={`ml-auto w-4 h-4 shrink-0 transition-transform duration-200 ${
                                                isSubmenuOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    )}
                                </button>
                                
                                {(isExpanded || isHovered) && (
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isSubmenuOpen ? "max-h-[800px] opacity-100 mt-1" : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <ul className="ml-5 border-l border-gray-400/30 pl-4 space-y-1 py-1">
                                            {nav.subItems.map((sub) => (
                                                <li key={sub.path}>
                                                    <Link
                                                        href={sub.path}
                                                        onClick={handleLinkClick}
                                                        prefetch={false} 
                                                        className={`block py-2 text-sm transition-all duration-200 rounded-md px-3 whitespace-nowrap ${
                                                            isActive(sub.path) ? "font-semibold bgg textn textw" : "hover:text-gray-300"
                                                        }`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            nav.path && (
                                <Link
                                    href={nav.path}
                                    onClick={handleLinkClick}
                                    prefetch={false} 
                                    className={`flex items-center p-2 menu-item group rounded-md transition-colors ${
                                        isActive(nav.path) ? "bgg textn font-semibold textw" : "hbgb"
                                    } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                                >
                                    <span className="shrink-0">{nav.icon}</span>
                                    {(isExpanded || isHovered || isMobileOpen) && (
                                        <span className="menu-item-text ml-3 whitespace-nowrap">{nav.name}</span>
                                    )}
                                </Link>
                            )
                        )}
                    </li>
                );
            })}
            
            {/* Show message if search yields no results */}
            {items.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                    No matching menus
                </div>
            )}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 py-4 left-0 bgn textw border-r h-screen transition-all duration-300 ease-in-out z-50 ${
                isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[80px]"
            } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                // Optional: clear search when mouse leaves sidebar
                // setSearchTerm(""); 
            }}
        >
            <div className="hidden lg:block mb-6">
                <div className={`flex ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}>
                    <Link href="/superadmin" className="flex justify-center items-center">
                        <Image src="/images/logo/logo-blank.png" alt="Logo" width={60} height={60} priority />
                    </Link>
                </div>
            </div>
            
            {/* 🚀 NEW: Search Bar Input */}
            <div className="mb-4">
                <div className={`flex items-center bg-white border border-white/10 rounded-lg overflow-hidden transition-all duration-200 focus-within:border-white/30 focus-within:bg-white/10 ${
                    isExpanded || isHovered || isMobileOpen ? "px-3 py-2.5" : "p-2.5 justify-center cursor-pointer"
                }`}>
                    <Search size={18} className="text-gray-400 shrink-0" />
                    {(isExpanded || isHovered || isMobileOpen) && (
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm  text-black  ml-2 w-full placeholder:text-gray-500"
                        />
                    )}
                </div>
            </div>
            
            <div className="flex flex-col flex-grow overflow-y-auto duration-300 ease-linear no-scrollbar pb-20">
                <nav className="mb-6">
                    <div>
                        {(isExpanded || isHovered || isMobileOpen) && (
                            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Main Menu</h2>
                        )}
                        {/* 🚀 Pass the FILTERED items instead of all items */}
                        {renderMenuItems(filteredNavItems, "main")}
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;