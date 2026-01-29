import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { Draw } from '../shared/draw.service';
import { File as FileService } from '../shared/file.service';
import { AuthService } from '../auth/auth.service';
import { GlobalService } from '../shared/global.service';
import { Router } from '@angular/router';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let mockDrawService: jest.Mocked<Draw>;
    let mockFileService: jest.Mocked<FileService>;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockGlobalService: jest.Mocked<GlobalService>;
    let mockRouter: jest.Mocked<Router>;

    beforeEach(async () => {
        // Create mock services
        mockDrawService = {
            rectangle: jest.fn(),
            circle: jest.fn(),
            freeform: jest.fn(),
        } as any;

        mockFileService = {
            save: jest.fn(),
            saveAsSTEP: jest.fn(),
            saveAsSTL: jest.fn(),
            upload: jest.fn(),
        } as any;

        mockAuthService = {
            logout: jest.fn(),
        } as any;

        mockGlobalService = {
            openSaveProjectPopup: jest.fn(),
        } as any;

        mockRouter = {
            navigate: jest.fn(),
        } as any;

        await TestBed.configureTestingModule({
            imports: [HeaderComponent], // Standalone Component
            providers: [
                { provide: Draw, useValue: mockDrawService },
                { provide: FileService, useValue: mockFileService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: GlobalService, useValue: mockGlobalService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('Navigation Methods', () => {
        it('should navigate to login page', () => {
            component.login();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('should navigate to register page', () => {
            component.register();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
        });

        it('should navigate to overview page', () => {
            component.home();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/overview']);
        });

        it('should call logout and navigate to login page', () => {
            component.logout();
            expect(mockAuthService.logout).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('File Operations', () => {
        it('should call saveProjectToFirebase', () => {
            component.saveProjectToFirebase();
            expect(mockGlobalService.openSaveProjectPopup).toHaveBeenCalled();
        });

        it('should call saveToLocalFile', () => {
            component.saveToLocalFile();
            expect(mockFileService.save).toHaveBeenCalled();
        });

        it('should call exportAsJSON', () => {
            component.exportAsJSON();
            expect(mockFileService.save).toHaveBeenCalled();
        });

        it('should call exportAsSTEP', () => {
            component.exportAsSTEP();
            expect(mockFileService.saveAsSTEP).toHaveBeenCalled();
        });

        it('should call exportAsSTL', () => {
            component.exportAsSTL();
            expect(mockFileService.saveAsSTL).toHaveBeenCalled();
        });

        it('should call uploadFromLocalFile', () => {
            component.uploadFromLocalFile();
            expect(mockFileService.upload).toHaveBeenCalled();
        });
    });

    describe('Drawing Methods', () => {
        it('should draw rectangle', () => {
            component.rectangle();
            expect(mockDrawService.rectangle).toHaveBeenCalled();
        });

        it('should draw circle', () => {
            component.circle();
            expect(mockDrawService.circle).toHaveBeenCalled();
        });

        it('should draw freeform', () => {
            component.freeform();
            expect(mockDrawService.freeform).toHaveBeenCalled();
        });
    });
});
