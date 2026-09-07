import { 
  BarChart2, Box, Users, ShoppingCart, Package, Factory, 
  Store, PieChart, Calculator, Shield, Info 
} from 'lucide-react';

export const MODULES_CONFIG = [
  { id: 'overview', label: 'Overview', icon: BarChart2, color: '#3b82f6' },
  { id: 'product', label: 'Product', icon: Box, color: '#6366f1' },
  { id: 'supplier', label: 'Supplier', icon: Users, color: '#2563eb' },
  { id: 'customer', label: 'Customer', icon: Users, color: '#10b981' },
  { id: 'purchase', label: 'Purchase', icon: ShoppingCart, color: '#3b82f6' },
  { id: 'stock', label: 'Stock', icon: Package, color: '#f59e0b' },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory, color: '#6366f1' },
  { id: 'sell', label: 'Sell', icon: Store, color: '#3b82f6' },
  { id: 'report', label: 'Report', icon: PieChart, color: '#ec4899' },
  { id: 'accounts', label: 'Accounts', icon: Calculator, color: '#10b981' },
  { id: 'employee', label: 'Employee', icon: Users, color: '#f97316' },
  { id: 'users', label: 'Users', icon: Shield, color: '#4f46e5' },
  { id: 'about', label: 'About', icon: Info, color: '#3b82f6' },
];
