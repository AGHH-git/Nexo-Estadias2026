// form-handler.ts
interface FormData {
    empresa_nombre: string;
    razon_social: string;
    domicilio: string;
    telefonos: string;
    cp: string;
    municipio: string;
    estado: string;
    giros: string[];
    tamano_empresa: string;
    tipo_empresa: string;
    nivel: string[];
    programa_educativo: string;
    alias: string;
    area: string;
    problematica: string;
    alcances: string[];
    linea_investigacion: string;
    producto_generar: string;
    asesor_nombre: string;
    asesor_cargo: string;
    asesor_telefono: string;
    asesor_email: string;
    compromiso_local: boolean;
    compromiso_foranea: boolean;
    tutor_firma: string;
    alumno_nombre: string;
    matricula: string;
    nss: string;
    alumno_email: string;
    celular: string;
    campus: string;
    sistema: string;
    horario_trabajo: string;
    fecha_inicio: string;
    fecha_termino: string;
    academico_nombre: string;
    academico_area: string;
    cargos: string[];
    academico_extension: string;
    academico_email: string;
    evaluaciones: string[];
    seguimiento_alumno: string;
    contacto_asesor: string;
    observaciones: string;
}

class FormHandler {
    private formData: FormData = {} as FormData;

    constructor() {
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Input fields tracking
        const inputs = document.querySelectorAll('.field-input[data-field]');
        inputs.forEach(input => {
            input.addEventListener('input', (e: Event) => {
                const target = e.target as HTMLInputElement;
                const field = target.dataset.field || '';
                if (field && !['fecha inicio'].includes(field)) {
                    this.formData[field] = target.value;
                } else if (field === 'fecha_start') {
                    this.formData.fecha_inicio = target.value;
                } else if (field === 'fecha_termino' || field === 'fecha termino') {
                    this.formData.fecha_termino = target.value;
                }
            });
        });

        // Checkbox tracking
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(chkbox => {
            chkbox.addEventListener('change', () => {
                this.collectCheckboxes();
            });
        });

        // Radio buttons tracking
        const radiobuttons = document.querySelectorAll('input[type="radio"]');
        radiobuttons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.collectRadios();
            });
        });
    }

    private collectCheckboxes(): void {
        const checkedChecks = document.querySelectorAll('input[type="checkbox"]:checked');
        const checkboxMap: Record<string, string[]> = {
            'data-check': 'giros',
            'data-level': 'nivel',
            'data-alcance': 'alcances',
            'data-cargo': 'cargos',
            'data-eval': 'evaluaciones',
            'data-compromiso': '' // Special handling needed
        };

        // Collect standard checkboxes
        Object.keys(checkboxMap).forEach(attr => {
            if (attr !== 'data-compromiso') {
                const fieldName = checkboxMap[attr];
                const checks = Array.from(document.querySelectorAll(`[${attr}]`))
                    .filter((chk: Element) => {
                        const input = chk as HTMLInputElement;
                        return input.checked;
                    })
                    .map((chk: Element) => {
                        const input = chk as HTMLInputElement;
                        return input.closest(`[${attr}]`)?.querySelector('')?.textContent?.trim() ||
                            (input as HTMLInputElement).value;
                    });

                this.formData[fieldName as keyof FormData] = checks;
            }
        });

        // Handle compromiso checkboxes separately
        const localChecked = document.querySelector('[data-compromiso="local"]').classList.contains('x-mark');
        const foraneChecked = document.querySelector('[data-compromiso="foranea"]').classList.contains('x-mark');
        this.formData.compromiso_local = !!document.querySelector('[data-compromiso="local"][type="checkbox"]:checked');
        this.formData.compromiso_foranea = !!document.querySelector('[data-compromiso="foranea"][type="checkbox"]:checked');
    }

    private collectRadios(): void {
        const radioGroups: Record<string, string> = {
            'tamano_empresa': 'tamano_empresa',
            'tipo_empresa': 'tipo_empresa',
            'campus': 'campus',
            'sistema': 'sistema',
            'seguimiento_alumno': 'seguimiento_alumno',
            'contacto_asesor': 'contacto_asesor'
        };

        Object.keys(radioGroups).forEach(name => {
            const selected = document.querySelector(`[name="${name}"]:checked`) as HTMLInputElement;
            if (selected) {
                this.formData[radioGroups[name] as keyof FormData] = selected.value;
            }
        });
    }

    public exportData(): object {
        this.collectCheckboxes();
        this.collectRadios();

        // Update from all current field values
        const allInputs = document.querySelectorAll('.field-input');
        allInputs.forEach(input => {
            const field = (input as HTMLInputElement).dataset.field;
            if (field) {
                this.formData[field as keyof FormData] = (input as HTMLInputElement).value;
            }
        });

        return this.formData;
    }

    public clearForm(): void {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea');
        inputs.forEach(input => {
            (input as HTMLInputElement | HTMLTextAreaElement).value = '';
        });

        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(chkbox => (chkbox as HTMLInputElement).checked = false);

        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => (radio as HTMLInputElement).checked = false);

        this.formData = {} as FormData;
        console.log('Formulario limpiado exitosamente');
    }

    public validateForm(): boolean {
        const requiredFields = ['empresa_nombre', 'alumno_nombre', 'matricula'];
        let isValid = true;

        requiredFields.forEach(field => {
            const element = document.querySelector(`[data-field="${field}"]`) as HTMLInputElement;
            if (!element?.value.trim()) {
                console.warn(`Campo requerido vacío: ${field}`);
                isValid = false;
            }
        });

        return isValid;
    }
}

// Initialize form handler on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.formHandler = new FormHandler();
});

// Make functions globally accessible
function exportData(): void {
    if ((window as unknown as { formHandler: FormHandler }).formHandler) {
        const data = (window as unknown as { formHandler: FormHandler }).formHandler.exportData();
        downloadJSON(data);
    }
}

function clearForm(): void {
    if ((window as unknown as { formHandler: FormHandler }).formHandler) {
        (window as unknown as { formHandler: FormHandler }).formHandler.clearForm();
    }
}

function downloadJSON(data: object): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formulario_estadia_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}