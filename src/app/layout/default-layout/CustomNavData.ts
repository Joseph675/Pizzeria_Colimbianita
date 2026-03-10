import { INavData } from '@coreui/angular';

export interface CustomNavData extends INavData {
  allowedFor?: string[]; // Propiedad opcional para definir los roles permitidos
}