import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { YourComponent } from './your-component';
// import { YourService } from './your-service';

describe('YourComponent', () => {
    let component: any;
    let fixture: ComponentFixture<any>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                // YourComponent, // Standalone Component
                // CommonModule, ReactiveFormsModule, etc.
            ],
            providers: [
                // { provide: YourService, useValue: mockService },
            ],
        }).compileComponents();

        // fixture = TestBed.createComponent(YourComponent);
        // component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // Beispiel: Service-Methode testen
    // it('should call service method', () => {
    //     const mockService = { method: jest.fn() };
    //     mockService.method();
    //     expect(mockService.method).toHaveBeenCalled();
    // });

    // Beispiel: Formular testen
    // it('should validate form', () => {
    //     component.form.setValue({ field: 'value' });
    //     expect(component.form.valid).toBeTruthy();
    // });
});
