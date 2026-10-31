<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Gate;

abstract class Controller
{
    /**
     * Authorize a given action for the current user via Gate.
     */
    public function authorize(mixed $ability, mixed $arguments = []): mixed
    {
        return Gate::authorize($ability, $arguments);
    }
}
