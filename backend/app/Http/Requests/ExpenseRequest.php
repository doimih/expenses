<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.regex' => 'Data trebuie să fie în format dd.mm.yyyy',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Convert dd.mm.yyyy to yyyy-mm-dd for storage
        if ($this->has('date') && preg_match('/^(\d{2})\.(\d{2})\.(\d{4})$/', $this->date, $matches)) {
            $this->merge([
                'date' => "{$matches[3]}-{$matches[2]}-{$matches[1]}",
            ]);
        }
    }
}
