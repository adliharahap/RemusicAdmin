import { LogOutIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../../../utils/handleLogout";


function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

// --- Komponen Sidebar ---
export default function SidebarContent({navigation, user, onClose }) {
    const pathname = usePathname();

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-900 px-6 pb-4 ring-1 ring-white/10">
            <div className="flex h-16 shrink-0 items-center justify-between">
                <h1 className="text-2xl font-bold text-white">ReMusic</h1>
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-400 hover:text-white lg:hidden"
                    onClick={onClose}
                >
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
            {/* Profile Section */}
            <div className="flex flex-col items-center gap-y-3 text-center">
                <img className="h-24 w-24 rounded-full bg-gray-800 object-cover ring-2 ring-slate-700" 
                src={user?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "https://i.pinimg.com/736x/f7/5c/b4/f75cb4ad9e644fa76c199b94c7c5877e.jpg"} alt="User profile" />
                <div>
                    <p className="font-semibold text-white">{user?.display_name || user?.user_metadata.full_name || "Unknown user"}</p>
                    <p className="text-sm text-gray-400">{user?.email ||  "unknown email"}</p>
                    <p className="mt-2 text-xs font-medium bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full inline-block">{user.role || "Unknown role"}</p>
                </div>
            </div>
            <nav className="flex flex-1 flex-col mt-4">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={classNames(
                                                isActive
                                                    ? 'bg-slate-800 text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-slate-800',
                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                            )}
                                        >
                                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={logout}
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-slate-800 hover:text-white"
                        >
                            <LogOutIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};