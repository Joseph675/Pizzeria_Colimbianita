import { DOCUMENT, NgStyle, NgForOf } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, Renderer2, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  RowComponent,
  TableDirective,
  TextColorDirective,
  WidgetStatAComponent,
  TemplateIdDirective,
  DropdownComponent,
  DropdownToggleDirective,
  DropdownMenuDirective,
  DropdownItemDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';


import { HttpClient, HttpClientModule } from '@angular/common/http';

import { Router, RouterLink } from '@angular/router';

import { cilArrowTop, cilOptions } from '@coreui/icons';

import { getStyle } from '@coreui/utils';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [NgForOf, DropdownItemDirective, DropdownComponent, DropdownMenuDirective, DropdownToggleDirective, TemplateIdDirective, WidgetStatAComponent, RouterLink, WidgetsDropdownComponent, TextColorDirective, CardComponent, CardBodyComponent, RowComponent, ColComponent, ButtonDirective, IconDirective, ReactiveFormsModule, ButtonGroupComponent, FormCheckLabelDirective, ChartjsComponent, NgStyle, CardFooterComponent, GutterDirective, ProgressBarDirective, ProgressComponent, WidgetsBrandComponent, CardHeaderComponent, TableDirective, AvatarComponent, HttpClientModule],
  standalone: true

})
export class DashboardComponent implements OnInit {

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #document: Document = inject(DOCUMENT);
  readonly #renderer: Renderer2 = inject(Renderer2);
  readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);


  constructor(private http: HttpClient) {

  }

  icons = { cilOptions, cilArrowTop };


  public usuariosPorTipo: { [key: string]: number } = {};
  public alumnos: any[] = [];
  public users: any[] = [];
  public facultades: any[] = [];
  public carreras: any[] = [];

  public inscripciones: any[] = [];
  public cursos: any[] = [];
  public materias: any[] = [];
  public inscripcionesPorCurso: { [key: string]: number } = {};
  public totalInscripciones: number = 0;
  public inscripcionesChartData: any = {};
  public inscripcionesChartOptions: any = {};

  public asistencias: any[] = [];
  public asistenciasChartData: any = {};
  public asistenciasChartOptions: any = {};
  public totalAsistencias: number = 0;
  public totalMaterias: number = 0;

  public sesiones: any[] = [];
  public sesionesChartData: any = {};
  public sesionesChartOptions: any = {};
  public totalSesiones: number = 0;

  data: any = {};
  options: any = {};


  optionsDefault = {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: true,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        min: 30,
        max: 89,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  };

  ngOnInit(): void {
    this.options = this.optionsDefault;

    Promise.all([this.loadFacultades(),this.loadUsuarios(), this.loadMaterias(),  this.loadCarreras(), this.loadCursosYMaterias(), this.loadInscripciones(), this.loadAsistencias(), this.loadSesiones()]).then(() => {
      this.loadAlumnos(); // Si necesitas cargar alumnos por separado
    });

  }

  loadCarreras(): void {
    this.http.get<any[]>('http://localhost:8080/api/carreras').subscribe(
      (data) => {
        this.carreras = data;
        // Si quieres, puedes actualizar alguna gráfica aquí
      },
      (error) => {
        console.error('Error al cargar los carreras:', error);
      }
    );
  }

  loadFacultades(): void {
    this.http.get<any[]>('http://localhost:8080/api/facultades').subscribe(
      (data) => {
        this.facultades = data;
        // Si quieres, puedes actualizar alguna gráfica aquí
      },
      (error) => {
        console.error('Error al cargar los facultades:', error);
      }
    );
  }

  loadAlumnos(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios/alumno').subscribe(
      (data) => {
        this.alumnos = data;
        // Si quieres, puedes actualizar alguna gráfica aquí
      },
      (error) => {
        console.error('Error al cargar los alumnos:', error);
      }
    );
  }
  loadUsuarios(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios').subscribe(
      (data) => {
        this.users = data;
        // Agrupa por tipo
        this.usuariosPorTipo = {};
        data.forEach(u => {
          const tipo = u.tipo || 'Sin tipo';
          this.usuariosPorTipo[tipo] = (this.usuariosPorTipo[tipo] || 0) + 1;
        });

        console.log('Usuarios:', this.usuariosPorTipo);

        // Actualiza la gráfica
        this.updateUsuariosChart();
      },
      (error) => {
        console.error('Error al cargar los usuarios:', error);
      }
    );
  }
  loadCursosYMaterias(): void {
    // Carga cursos y materias en paralelo
    this.http.get<any[]>('http://localhost:8080/api/cursos').subscribe(cursos => {
      this.cursos = cursos;
      this.http.get<any[]>('http://localhost:8080/api/materias').subscribe(materias => {
        this.materias = materias;
        this.updateInscripcionesChart(); // Llama después de tener ambos
      });
    });
  }
  loadInscripciones(): void {
    this.http.get<any[]>('http://localhost:8080/api/inscripciones').subscribe(data => {
      this.inscripciones = data;
      this.totalInscripciones = data.length;
      this.updateInscripcionesChart();
    });
  }
  loadAsistencias(): void {
    this.http.get<any[]>('http://localhost:8080/api/asistencias').subscribe(data => {
      this.asistencias = data;
      console.log('Asistencias:', this.asistencias);
      this.totalAsistencias = data.length;
      this.updateAsistenciasChart();
    });
  }
  loadSesiones(): void {
    this.http.get<any[]>('http://localhost:8080/api/sesiones').subscribe(data => {
      this.sesiones = data;
      this.totalSesiones = data.length;
      this.updateSesionesChart();
    });
  }
  loadMaterias(): void {
    this.http.get<any[]>('http://localhost:8080/api/materias').subscribe(data => {
      this.materias = data;
      this.totalMaterias = data.length;
    });
  }
  updateUsuariosChart(): void {
    const labels = Object.keys(this.usuariosPorTipo); // ['admin', 'administrativo', 'alumno', 'profesor']
    const data = Object.values(this.usuariosPorTipo); // [total_admin, total_administrativo, ...]

    this.data = {
      labels,
      datasets: [
        {
          label: 'Usuarios por tipo',
          backgroundColor: 'transparent',
          borderColor: '#fff', // Línea blanca para que se vea sobre fondo azul
          pointBackgroundColor: '#fff',
          pointHoverBorderColor: '#fff',
          data,
          tension: 0.4 // suaviza la línea
        }
      ]
    };

    this.options = {
      plugins: {
        legend: { display: false }
      },
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#fff' }
        },
        y: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        }
      }
    };
  }
  updateInscripcionesChart(): void {
    if (!this.inscripciones.length || !this.cursos.length || !this.materias.length) return;

    // Agrupa inscripciones por cursoPk
    const conteo: { [key: string]: number } = {};
    this.inscripciones.forEach(i => {
      conteo[i.cursoPk] = (conteo[i.cursoPk] || 0) + 1;
    });

    // Obtén nombres de materia para cada cursoPk
    const labels = Object.keys(conteo).map(cursoPk => {
      const curso = this.cursos.find(c => c.cursoPk == cursoPk);
      if (!curso) return 'Curso ' + cursoPk;
      const materia = this.materias.find(m => m.materiaPk == curso.materiaPk);
      return materia ? materia.nombre : 'Curso ' + cursoPk;
    });

    const data = Object.values(conteo);

    this.inscripcionesChartData = {
      labels,
      datasets: [
        {
          label: 'Inscripciones por curso',
          backgroundColor: 'transparent',
          borderColor: '#fff',
          pointBackgroundColor: '#fff',
          pointHoverBorderColor: '#fff',
          data,
          tension: 0.4
        }
      ]
    };

    this.inscripcionesChartOptions = {
      plugins: { legend: { display: false } },
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#fff' } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
      }
    };
  }
  updateAsistenciasChart(): void {
    if (!this.asistencias.length || !this.users.length) return;

    // Agrupa asistencias por alumnoId
    const conteo: { [key: string]: number } = {};
    this.asistencias.forEach(a => {
      conteo[a.alumnoId] = (conteo[a.alumnoId] || 0) + 1;
    });

    // Obtén nombres de usuario para cada alumnoId
    const labels = Object.keys(conteo).map(alumnoId => {
      const user = this.users.find(u => u.uid == alumnoId);
      return user ? user.nombre : 'Alumno ' + alumnoId;
    });

    const data = Object.values(conteo);

    this.asistenciasChartData = {
      labels,
      datasets: [
        {
          label: 'Asistencias por alumno',
          backgroundColor: 'transparent',
          borderColor: '#fff',
          pointBackgroundColor: '#fff',
          pointHoverBorderColor: '#fff',
          data,
          tension: 0.4
        }
      ]
    };

    this.asistenciasChartOptions = {
      plugins: { legend: { display: false } },
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#fff' } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
      }
    };
  }
  updateSesionesChart(): void {
    if (!this.sesiones.length || !this.cursos.length || !this.materias.length) return;

    // Agrupa sesiones por cursoPk
    const conteo: { [key: string]: number } = {};
    this.sesiones.forEach(s => {
      conteo[s.cursoPk] = (conteo[s.cursoPk] || 0) + 1;
    });

    // Obtén nombre de la materia y horas semanales para cada cursoPk
    const labels = Object.keys(conteo).map(cursoPk => {
      const curso = this.cursos.find(c => c.cursoPk == +cursoPk);
      if (!curso) return 'Curso ' + cursoPk;
      const materia = this.materias.find(m => m.materiaPk == curso.materiaPk);
      return materia
        ? `${materia.nombre} (${curso.horasSemanales}h)`
        : `Curso ${cursoPk} (${curso.horasSemanales}h)`;
    });

    // Puedes mostrar la cantidad de sesiones por curso
    const data = Object.values(conteo);

    this.sesionesChartData = {
      labels,
      datasets: [
        {
          label: 'Sesiones por curso',
          backgroundColor: 'transparent',
          borderColor: '#fff',
          pointBackgroundColor: '#fff',
          pointHoverBorderColor: '#fff',
          data,
          tension: 0.4
        }
      ]
    };
console.log(this.sesionesChartData)
    this.sesionesChartOptions = {
      plugins: { legend: { display: false } },
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#fff' } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
      }
    };
  }
  updateAlumnosChart(): void {
    // Agrupa alumnos por carrera (ajusta el campo según tu modelo)
    const carreras: { [key: string]: number } = {};
    this.alumnos.forEach(alumno => {
      const carrera = alumno.carrera || 'Sin carrera';
      carreras[carrera] = (carreras[carrera] || 0) + 1;
    });

    // Prepara los datos para Chart.js
    this.mainChart = {
      type: 'bar',
      data: {
        labels: Object.keys(carreras),
        datasets: [
          {
            label: 'Alumnos por carrera',
            data: Object.values(carreras),
            backgroundColor: '#339af0'
          }
        ]
      }
    };
  }

  // 1. Iniciales para el avatar
  getInitials(nombre: string): string {
    if (!nombre) return '';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // 2. Color para el avatar (puedes personalizarlo)
  getColorForUser(user: any): string {
    // Simple hash para color
    const colors = ['#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#17a2b8'];
    let hash = 0;
    for (let i = 0; i < user.nombre.length; i++) hash += user.nombre.charCodeAt(i);
    return colors[hash % colors.length];
  }

  // 3. Facultad y carrera (ajusta los campos según tu modelo)
  getFacultadNombre(user: any): string {
    // user.facultadId es el id, facultades es el array con { facultadPk, nombre }
    const facultad = this.facultades.find(f => f.facultadId == user.facultadId);
    return facultad ? facultad.nombre : 'Sin facultad';
  }

  getCarreraNombre(user: any): string {
    // user.carrera es el id, carreras es el array con { carreraPk, nombre }
    const carrera = this.carreras.find(c => c.carreraPk == user.carrera);
    return carrera ? carrera.nombre : 'Sin carrera';
  }

  // 4. Curso/materia donde tiene más asistencias
  getCursoConMasAsistencias(alumno: any): number | null {
    const asistenciasAlumno = this.asistencias.filter(a => a.alumnoId === alumno.uid);
    const conteo: { [cursoPk: number]: number } = {};
    asistenciasAlumno.forEach(a => {
      conteo[a.sesionId] = conteo[a.sesionId] ? conteo[a.sesionId] + 1 : 1;
    });
    // Map sesionId a cursoPk
    const sesionToCurso: { [sesionId: number]: number } = {};
    this.sesiones.forEach(s => sesionToCurso[s.sesionId] = s.cursoPk);
    const conteoPorCurso: { [cursoPk: number]: number } = {};
    asistenciasAlumno.forEach(a => {
      const cursoPk = sesionToCurso[a.sesionId];
      if (cursoPk) conteoPorCurso[cursoPk] = (conteoPorCurso[cursoPk] || 0) + 1;
    });
    // Encuentra el curso con más asistencias
    let max = 0;
    let maxCurso: number | null = null;
    Object.entries(conteoPorCurso).forEach(([cursoPk, count]) => {
      if (count > max) { max = count as number; maxCurso = +cursoPk; }
    });
    return maxCurso;
  }

  // 5. Nombre de la materia de un curso
  getMateriaNombre(cursoPk: number): string {
    const curso = this.cursos.find(c => c.cursoPk === cursoPk);
    if (!curso) return 'Sin curso';
    const materia = this.materias.find(m => m.materiaPk === curso.materiaPk);
    return materia ? materia.nombre : 'Sin materia';
  }

  // 6. Asistencias del alumno en ese curso
  getAsistenciasEnCurso(alumno: any, cursoPk: number): number {
    // Busca sesiones de ese curso
    const sesionesCurso = this.sesiones.filter(s => s.cursoPk === cursoPk).map(s => s.sesionId);
    // Cuenta asistencias del alumno en esas sesiones
    return this.asistencias.filter(a => a.alumnoId === alumno.uid && sesionesCurso.includes(a.sesionId)).length;
  }

  // 7. Total de sesiones del curso en el semestre (16 semanas)
  getTotalSesionesCursoSemestre(cursoPk: number): number {
    // Cuenta cuántos días distintos a la semana tiene el curso
    const sesionesCurso = this.sesiones.filter(s => s.cursoPk === cursoPk);
    const dias = new Set(sesionesCurso.map(s => s.dia_semana));
    // Total de sesiones = días por semana * 16
    return dias.size * 16;
  }

  // 8. Porcentaje de asistencia en ese curso
  getAsistenciaPorcentaje(alumno: any, cursoPk: number): number {
    const total = this.getTotalSesionesCursoSemestre(cursoPk);
    if (total === 0) return 0;
    const asistencias = this.getAsistenciasEnCurso(alumno, cursoPk);
    return Math.round((asistencias / total) * 100);
  }

  // 9. Mensaje según el porcentaje
  getAsistenciaMensaje(porcentaje: number): string {
    if (porcentaje >= 80) return 'Excelente asistencia';
    if (porcentaje >= 50) return 'Asistencia media';
    if (porcentaje > 0) return 'Baja asistencia';
    return 'Sin asistencias';
  }


  trackByAlumno(index: number, alumno: any) {
    return alumno.idUsuUni;
  }
  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  #mainChartRefEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });
  public chart: Array<IChartProps> = [];
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month')
  });



  initCharts(): void {
    this.mainChart = this.#chartsData.mainChart;
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.#chartsData.initMainChart(value);
    this.initCharts();
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  updateChartOnColorModeChange() {
    const unListen = this.#renderer.listen(this.#document.documentElement, 'ColorSchemeChange', () => {
      this.setChartStyles();
    });

    this.#destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.#chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }


}
