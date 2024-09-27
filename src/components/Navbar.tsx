"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ModeToggle } from "./dark-mode-toggle";
import logo from "../app/logo.png";
import Logout from "./Logout";

const NavItem = ({ href, text }: { href: string; text: string }) => (
  <Link
    href={href}
    className="text-white hover:bg-black hover:text-white px-3 py-2 rounded-md text-sm font-medium"
  >
    {text}
  </Link>
);

interface NavbarProps {
  role?: string;
}
export default function Navbar({ role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-smartherapy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image src={logo} alt="Logo" width={100} height={100} />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavItem href="/" text="Home" />
                <NavItem href="/therapist" text="Therapist Dashboard" />
                {role === "admin" && (
                  <NavItem href="/admin" text="Admin Dashboard" />
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            {role && <Logout />}
          </div>
          <div className="md:hidden flex items-center">
            <ModeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavItem href="/" text="Home" />
            <NavItem href="/therapist" text="Therapist Dashboard" />
            <NavItem href="/admin" text="Admin Dashboard" />
          </div>
        </div>
      )}
    </nav>
  );
}
