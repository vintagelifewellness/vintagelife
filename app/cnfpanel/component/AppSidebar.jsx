"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSidebar } from '@/app/context/SidebarContext';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
    UserCircle, 
    ChevronDown, 
    LayoutDashboard, 
    Package, 
    ClipboardList, 
    BadgeDollarSign, 
    MessageSquareText, 
    LockKeyhole,
    Search
} from "lucide-react";

const navItems = [
    {
        icon: <LayoutDashboard />, name: "Dashboard", path: "/cnfpanel",
    },
    {
        icon: <UserCircle />, name: "C&F Profile",
        subItems: [
            { name: "My Profile", path: "/cnfpanel/cnfprofile/profile", pro: false },
        ],
    },
    {
        icon: <Package />, name: "Stock", path: "/cnfpanel/stock",
    },
    {
        icon: <ClipboardList />,
        name: "Order Management",
        subItems: [
            { name: "Pending Orders", path: "/cnfpanel/pendingorder", pro: false },
            { name: "My Approved Orders", path: "/cnfpanel/approvedorder", pro: false },
        ],
    },
    {
        icon: <BadgeDollarSign />,
        name: "Commission",
        subItems: [
            { name: "Commission", path: "/cnfpanel/comission", pro: false },
        ],
    },
    {
        icon: <MessageSquareText />,
        name: "Request To Superadmin",
        subItems: [
            { name: "Request To Superadmin", path: "/cnfpanel/RequestToSuperadmin", pro: false },
        ],
    },
    {
        icon: <LockKeyhole />, name: "Update Password", path: "/cnfpanel/change-password",
    },
];

const CnfSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState("");
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [subMenuHeight, setSubMenuHeight] = useState({});
    const subMenuRefs = useRef({});

    const handleLinkClick = () => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
    };

    const isActive = useCallback((path) => path === pathname, [pathname]);

    // Search Filtering Logic
    const filteredNavItems = navItems.map(item => {
        const mainMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        let subItemsMatch = false;
        let filteredSubItems = [];

        if (item.subItems) {
            filteredSubItems = item.subItems.filter(sub =>
                sub.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            subItemsMatch = filteredSubItems.length > 0;
        }

        if (mainMatch) {
            return item; // Keep main item and all subitems if main name matches
        } else if (subItemsMatch) {
            return { ...item, subItems: filteredSubItems }; // Keep main item but only matching subitems
        }
        return null;
    }).filter(Boolean); // Remove null items

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.name}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => {
                    const newHeight = subMenuRefs.current[key]?.scrollHeight || 0;
                    return { ...prevHeights, [key]: newHeight };
                });
            }
        }
    }, [openSubmenu, searchTerm]); // Added searchTerm dependency so height recalculates on filter

    const handleSubmenuToggle = (name, menuType) => {
        setOpenSubmenu((prev) =>
            prev?.type === menuType && prev?.name === name ? null : { type: menuType, name }
        );
    };

    const renderMenuItems = (items, menuType) => (
        <ul className="flex flex-col gap-4">
            {items.map((nav) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <>
                            <button
                                onClick={() => {
                                    if (isExpanded || isHovered) {
                                        handleSubmenuToggle(nav.name, menuType);
                                    }
                                }}
                                className={`menu-item w-full group rounded-md ${openSubmenu?.type === menuType && openSubmenu?.name === nav.name
                                    ? "bgg textn font-semibold "
                                    : "hbgb "
                                    } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                                    }`}
                            >
                                <span className="shrink-0">
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text text-left flex-1 truncate">{nav.name}</span>
                                )}
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <ChevronDown
                                        className={`ml-auto shrink-0 w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                                            openSubmenu?.name === nav.name
                                            ? "rotate-180"
                                            : ""
                                            }`}
                                    />
                                )}
                            </button>
                            {(isExpanded || isHovered) && (
                                <div
                                    ref={(el) => (subMenuRefs.current[`${menuType}-${nav.name}`] = el)}
                                    className={`overflow-hidden transition-all duration-300 ease-in-out
                                  ${openSubmenu?.type === menuType && openSubmenu?.name === nav.name
                                            ? "max-h-[500px] opacity-100"
                                            : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <ul className="ml-5 borderwl pl-4 mt-2 space-y-2">
                                        {nav.subItems.map((sub) => (
                                            <li key={sub.path}>
                                                <Link
                                                    href={sub.path}
                                                    onClick={handleLinkClick}
                                                    className={`block py-2 text-sm transition-all duration-200 rounded-md px-2 ${isActive(sub.path) ? "font-semibold bgg textn textw" : "hbgb"}`}
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
                                    <span className="menu-item-text truncate">{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                </li>
            ))}
            {items.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-4">No results found</p>
            )}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bgn textw borderwr h-screen transition-all duration-300 ease-in-out z-50 ${isExpanded || isMobileOpen
                ? "w-[290px]"
                : isHovered
                    ? "w-[290px]"
                    : "w-[90px]"
                } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => {
                if (!isExpanded) {
                    setIsHovered(false);
                    setSearchTerm(""); // Clear search when hovering out
                }
            }}
        >
            <div className="hidden lg:block">
                <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    <Link href="/cnfpanel" className="w-full flex justify-center items-center">
                        {isExpanded || isHovered || isMobileOpen ? (
                            <div className="hidden lg:block"> 
                                <Image src="/images/logo/logo-blank.png" alt="Logo" width={80} height={80} />
                            </div>
                        ) : (
                            <Image src="/images/logo/logo-blank.png" alt="Logo" width={80} height={80} />
                        )}
                    </Link>
                </div>
            </div>

            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-10">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            {/* SEARCH BAR UI */}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <div className="mb-6 relative transition-all duration-300">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search menu..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            )}

                            <h2 className="mb-4 font-bold uppercase flex leading-[20px] textw">Menu</h2>
                            {/* Render Filtered Items */}
                            {renderMenuItems(filteredNavItems, "main")}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default CnfSidebar;