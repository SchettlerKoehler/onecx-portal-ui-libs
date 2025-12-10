import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ContentContainerModule } from './content-container.module'
import { OcxContentContainerComponent } from './content-container.component'

describe('OcxContentContainerComponent (secondary entry)', () => {
  let fixture: ComponentFixture<OcxContentContainerComponent>
  let component: OcxContentContainerComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentContainerModule],
    }).compileComponents()

    fixture = TestBed.createComponent(OcxContentContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
