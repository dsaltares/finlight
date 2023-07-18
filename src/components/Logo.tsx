import Link from "next/link";
import Image from "next/image";
import Routes from "@lib/routes";

const Logo = () => <Link href={Routes.home}><Image alt="logo" width={100} height={90} src="/logo-regular.svg"/></Link>;

export default Logo;
