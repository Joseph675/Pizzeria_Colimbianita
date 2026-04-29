import { INavData } from '@coreui/angular';
import { CustomNavData } from './CustomNavData'; // Asegúrate de importar la interfaz correcta

export const navItems: CustomNavData[] = [
  
  {
    title: true,
    name: 'Menú & Productos'
  },
  {
    name: 'Dashboards',
    url: '/dashboard',
    materialIcon: 'dashboard',
  },
  {
    name: 'Pos Ventas',
    url: '/pos',
    materialIcon: 'dashboard',
  },
   {
    name: 'Modulo Cocina',
    url: '/cocina',
    materialIcon: 'kebab_dining',
  },
  {    
    name: 'Pedidos',
    url: '/pedidos',
    materialIcon: 'fastfood',  
  },

  {
    name: 'Productos',
    url: '/productos',
    materialIcon: 'restaurant',  // Material icon name
  },
  {
    name: 'facturación',
    url: '/facturacion',
    materialIcon: 'receipt_long',  // Material icon name
  },

  {
    name: 'Presentaciones',
    url: '/presentaciones',
    materialIcon: 'view_carousel',  // Material icon name
  },


  {
    name: 'Categorías',
    url: '/categorias',
    materialIcon: 'category',  // Material icon name
  },

  {
    name: 'Combos y Promociones',
    url: '/combos-promociones',
    materialIcon: 'redeem',  // Material icon name
  },

  {
    title: true,
    name: 'Negocio'
  },

  {
    name: 'mesas',
    url: '/mesas',
    materialIcon: 'table_restaurant',  // Material icon name
  },

  {
    name: 'Clientes',
    url: '/clientes',
    materialIcon: 'people',  // Material icon name
  },

  {
    name: 'Ingredientes',
    url: '/ingredientes',
    materialIcon: 'local_pizza',  // Material icon name
  },
  {
    name: 'Inventario',
    url: '/inventario',
    materialIcon: 'inventory',  // Material icon name
  },



  {
    title: true,
    name: 'Sistema'
  },

  {
    name: 'Usuario y Roles',
    url: '/usuarios',
    materialIcon: 'people',  // Material icon name
  },

  {
    name: 'Reportes',
    url: '/reportes',
    materialIcon: 'description',  // Material icon name
  },

  {
    name: 'Configuración',
    url: '/configuracion',
    materialIcon: 'settings',  // Material icon name
  },

  

 

];
