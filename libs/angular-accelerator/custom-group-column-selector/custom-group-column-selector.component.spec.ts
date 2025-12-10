import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { CustomGroupColumnSelectorComponent } from './custom-group-column-selector.component'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { PickListModule } from 'primeng/picklist'
import { SelectButtonModule } from 'primeng/selectbutton'

describe('CustomGroupColumnSelectorComponent (secondary entry)', () => {
	let component: CustomGroupColumnSelectorComponent
	let fixture: ComponentFixture<CustomGroupColumnSelectorComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CustomGroupColumnSelectorComponent],
			imports: [
				CommonModule,
				TranslateTestingModule.withTranslations({}),
				FormsModule,
				DialogModule,
				ButtonModule,
				PickListModule,
				SelectButtonModule,
			],
		}).compileComponents()

		fixture = TestBed.createComponent(CustomGroupColumnSelectorComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
