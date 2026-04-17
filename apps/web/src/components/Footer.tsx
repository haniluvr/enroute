import { Link as Linkedin, X as Twitter, ArrowUp } from 'lucide-react';

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-bloom-black pb-12">
            {/* Top White Card Segment */}
            <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="bg-white rounded-[32px] p-12 text-black shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12">
                        {/* Logo Column */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 text-2xl font-heading font-bold tracking-tight mb-8">
                                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1.5">
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                                </div>
                                Bloom
                            </div>
                        </div>

                        {/* Information Column */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Information</h4>
                            <ul className="space-y-4 text-sm font-medium">
                                <li><a href="#" className="hover:text-gray-600 transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">About us</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">Partners</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">Contacts</a></li>
                            </ul>
                        </div>

                        {/* Menu Column */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Menu</h4>
                            <ul className="space-y-4 text-sm font-medium">
                                <li><a href="#" className="hover:text-gray-600 transition-colors">For Individuals</a></li>
                                <li><a href="#" className="hover:text-gray-600 transition-colors">For Teams</a></li>
                            </ul>
                        </div>

                        {/* Contact/CTA Column */}
                        <div className="flex flex-col items-end">
                            <button className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm mb-6 hover:bg-gray-800 transition-colors w-full md:w-auto">
                                Create account
                            </button>
                            <div className="text-right space-y-2 text-sm font-medium">
                                <p>(629) 555-0129</p>
                                <p>info@Bloomteam.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom row of the card */}
                    <div className="mt-16 flex flex-wrap items-end justify-between pt-8 border-t border-gray-100">
                        <div className="flex gap-3 mb-4 md:mb-0">
                            <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Twitter className="w-5 h-5 fill-current" />
                            </a>
                        </div>

                        <div className="text-sm font-medium text-center flex-1 mx-4 mb-4 md:mb-0">
                            2972 Westheimer Rd. <br />
                            Santa Ana, Illinois 85486
                        </div>

                        <button 
                            onClick={scrollToTop}
                            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Background Image Segment */}
            <div className="relative h-[600px] overflow-hidden">
                <img 
                    src="/footer_background_painting.png" 
                    alt="Classical painting background" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                
                <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
                    <div className="mb-24 max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-heading font-semibold text-white leading-tight mb-8">
                            Need a little more guidance or clarity on your next step?
                        </h2>
                        
                        <div className="flex flex-col gap-2">
                            <p className="text-white/80 text-sm font-medium mb-2">
                                Just send us your contact/ email and we will send a message you.
                            </p>
                            <div className="flex rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-2 max-w-lg">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="bg-transparent border-none outline-none text-white px-6 py-2 w-full placeholder:text-white/40"
                                />
                                <button className="invisible px-6 py-2">Submit</button> {/* Space for alignment if needed like the image */}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-white/60 text-sm font-medium border-t border-white/10 pt-8">
                        <div className="flex items-center gap-8">
                            <span>© 2025 — Copyright</span>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        </div>
                        <div className="flex items-center gap-2 font-heading font-bold overflow-hidden h-6">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                            Bloom
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
