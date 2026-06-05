"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSidebar } from '@/app/context/SidebarContext';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, UserCircle, BookOpenText, KeyRound, Trophy, CoinsIcon, ChevronDown, UsersRound, FileUser } from "lucide-react";

const navItems = [
    {
        icon: <CoinsIcon />, name: "Dashboard", path: "/cnfpanel",
    },
    {
        icon: <UserCircle />, name: "C&F Profile",
        subItems: [
            { name: "My Profile", path: "/cnfpanel/cnfprofile/profile", pro: false },
        ],
    },
    {
        icon: <BookOpenText />,
        name: "Order Management",
        subItems: [
          
            { name: "Pending Orders", path: "/cnfpanel/pendingorder", pro: false },
            { name: "My Approved Orders", path: "/cnfpanel/approvedorder", pro: false },
         
        ],
    },
     {
        icon: <BookOpenText />,
        name: "comission",
        subItems: [
          
            { name: "comission", path: "/cnfpanel/comission", pro: false },
          
         
        ],
    },
     {
        icon: <BookOpenText />,
        name: "RequestToSuperadmin",
        subItems: [
          
            { name: "RequestToSuperadmin", path: "/cnfpanel/RequestToSuperadmin", pro: false },
         
        ],
    },
  
    {
        icon: <KeyRound />, name: "Update Password", path: "/cnfpanel/change-password",
    },
];

const CnfSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
    const pathname = usePathname();
    const handleLinkClick = () => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
    };

    const renderMenuItems = (navItems, menuType) => (
        <ul className="flex flex-col gap-4">
            {navItems.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <>
                            <button
                                onClick={() => {
                                    if (isExpanded || isHovered) {
                                        handleSubmenuToggle(index, menuType);
                                    }
                                }}
                                className={`menu-item group rounded-md ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "bgg textn font-semibold "
                                    : "hbgb "
                                    } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                                    }`}
                            >
                                <span className="shrink-0">
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <ChevronDown
                                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                                            openSubmenu?.index === index
                                            ? "rotate-180"
                                            : ""
                                            }`}
                                    />
                                )}
                            </button>
                            {(isExpanded || isHovered) && (
                                <div
                                    ref={(el) => (subMenuRefs.current[`${menuType}-${index}`] = el)}
                                    className={`overflow-hidden transition-all duration-300 ease-in-out
                                  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                            ? "max-h-[500px] opacity-100"
                                            : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <ul className="ml-5 borderwl  pl-4 mt-2 space-y-2">
                                        {nav.subItems.map((sub) => (
                                            <li key={sub.path}>
                                                <Link
                                                    href={sub.path}
                                                    onClick={handleLinkClick}
                                                    className={`block py-2 text-sm transition-all duration-200 rounded-md px-2 ${isActive(sub.path) ? "font-semibold bgg textn  textw " : "hbgb"}`}
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
                                className={`menu-item group rounded-md ${isActive(nav.path) ? "bgg textn font-semibold textw" : "hbgb"}`}
                            >
                                <span className="shrink-0">
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                </li>
            ))}
        </ul>
    );

    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [subMenuHeight, setSubMenuHeight] = useState({});
    const subMenuRefs = useRef({});
    const isActive = useCallback((path) => path === pathname, [pathname]);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => {
                    const newHeight = subMenuRefs.current[key]?.scrollHeight || 0;
                    return { ...prevHeights, [key]: newHeight };
                });
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (index, menuType) => {
        setOpenSubmenu((prev) =>
            prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
        );
    };

    return (
        <aside
            className={`fixed  mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bgn textw  borderwr h-screen transition-all duration-300 ease-in-out z-50 ${isExpanded || isMobileOpen
                ? "w-[290px]"
                : isHovered
                    ? "w-[290px]"
                    : "w-[90px]"
                } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className=" hidden lg:block">
                <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    <Link href="/cnfpanel" className="w-full flex justify-center items-center"> {/* Yahan link '/cnfpanel' kiya */}
                        {isExpanded || isHovered || isMobileOpen ? (
                            <>
                                <div className="hidden lg:block"> <Image src="/images/logo/logo-blank.png" alt="Logo" width={80} height={80} /></div>
                            </>
                        ) : (
                            <Image src="/images/logo/logo-blank.png" alt="Logo" width={80} height={80} />
                        )}
                    </Link>
                </div>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="mb-4 font-bold uppercase flex leading-[20px] textw">Menu</h2>
                            {renderMenuItems(navItems, "main")}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};
export default CnfSidebar;