/**
 * Sazón & Fuego — Lógica Frontend SPA, Consumo de Web Services y Validación de Formularios
 * Desarrollo Web Integral — Unidad 3: Seguridad, Web Services y APIs
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. ENRUTADOR DE PANTALLAS SPA (#inicio, #tema, #registro, #seguridad)
  // ==========================================================================
  const VALID_ROUTES = ['inicio', 'tema', 'registro', 'seguridad'];
  const navButtons = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.app-screen');
  let currentRecipesCache = [];

  function switchScreen(route) {
    const targetRoute = VALID_ROUTES.includes(route) ? route : 'inicio';

    navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === targetRoute);
    });

    screens.forEach((sec) => {
      sec.classList.toggle('active', sec.id === `screen-${targetRoute}`);
    });

    if (window.location.hash !== `#${targetRoute}`) {
      history.replaceState(null, '', `#${targetRoute}${window.location.search}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.route));
  });

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchScreen(el.dataset.goto);
    });
  });

  const brandLogo = document.querySelector('.brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchScreen('inicio');
    });
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash) switchScreen(hash);
  });

  // ==========================================================================
  // 2. UTILIDAD DE ESCAPE HTML PARA PREVENIR DOM XSS EN EL CLIENTE
  // ==========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // 3. CONSUMO DEL WEB SERVICE DE RECETAS (TheMealDB + Tipo de Cambio vía .env)
  // ==========================================================================
  const heroFeaturedContainer = document.getElementById('heroFeaturedRecipe');
  const heroExchangeBadge = document.getElementById('heroExchangeBadge');
  const topExchangeTicker = document.getElementById('topExchangeTicker');
  const explorerExchangeRate = document.getElementById('explorerExchangeRate');
  const currentApiEndpoint = document.getElementById('currentApiEndpoint');
  const apiStatusBanner = document.getElementById('apiStatusBanner');
  const recipesGrid = document.getElementById('recipesGrid');

  function updateExchangeIndicators(exchangeObj) {
    if (!exchangeObj || !exchangeObj.usdToMxn) return;
    const text = `1 USD = $${Number(exchangeObj.usdToMxn).toFixed(2)} MXN`;
    if (heroExchangeBadge) heroExchangeBadge.textContent = text;
    if (topExchangeTicker) topExchangeTicker.textContent = text;
    if (explorerExchangeRate) explorerExchangeRate.textContent = text;
  }

  async function loadHeroFeaturedRecipe() {
    try {
      const res = await fetch('/api/recipes/search?q=Arrabiata');
      const data = await res.json();
      if (data.exchangeRate) updateExchangeIndicators(data.exchangeRate);

      const recipe = data.recipes && data.recipes[0];
      if (!recipe) return;

      const topIngs = (recipe.ingredientes || [])
        .slice(0, 4)
        .map((i) => `${escapeHtml(i.ingrediente)} (${escapeHtml(i.medida)})`)
        .join(' • ');

      heroFeaturedContainer.innerHTML = `
        <div class="featured-recipe-inner">
          <div class="featured-img-wrap">
            <img src="${escapeHtml(recipe.imagen)}" alt="${escapeHtml(recipe.nombre)}" />
            <div class="featured-overlay-tags">
              <span class="tag-chip">🌍 ${escapeHtml(recipe.origen)}</span>
              <span class="tag-chip">🍽️ ${escapeHtml(recipe.categoria)}</span>
              <span class="tag-chip">🧪 ${recipe.totalIngredientes} ingredientes</span>
            </div>
          </div>
          <div class="featured-info">
            <h3>${escapeHtml(recipe.nombre)}</h3>
            <p><strong>Ingredientes clave:</strong> ${topIngs}</p>
            <div class="featured-cost-bar">
              <span>Costo estimado (4 porciones):</span>
              <strong>$${recipe.costoEstimado.mxn} MXN <small>($${recipe.costoEstimado.usd} USD)</small></strong>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      heroFeaturedContainer.innerHTML = `<p style="padding:1rem;color:#fca5a5;">Error al conectar con el Web Service local.</p>`;
    }
  }

  function renderRecipesGrid(recipes, endpointCalled, sourceDesc) {
    currentRecipesCache = recipes || [];
    if (currentApiEndpoint) currentApiEndpoint.textContent = endpointCalled;
    if (apiStatusBanner) {
      apiStatusBanner.innerHTML = `✅ <strong>Respuesta recibida de:</strong> ${escapeHtml(
        sourceDesc
      )} — Mostrando <strong>${currentRecipesCache.length}</strong> platillos internacionales con costeo en divisas en tiempo real.`;
    }

    if (!currentRecipesCache.length) {
      recipesGrid.innerHTML = `<p>No se encontraron platillos para esta consulta.</p>`;
      return;
    }

    recipesGrid.innerHTML = currentRecipesCache
      .map((r, idx) => {
        const previewIngs = (r.ingredientes || [])
          .slice(0, 5)
          .map((ing) => `<span class="ing-chip">${escapeHtml(ing.ingrediente)}</span>`)
          .join('');

        const shortInstructions =
          r.instrucciones && r.instrucciones.length > 135
            ? `${escapeHtml(r.instrucciones.slice(0, 135))}...`
            : escapeHtml(r.instrucciones);

        return `
          <article class="recipe-card">
            <div class="recipe-thumb">
              <img src="${escapeHtml(r.imagen)}" alt="${escapeHtml(r.nombre)}" loading="lazy" />
              <div class="recipe-badges">
                <span class="tag-chip">${escapeHtml(r.categoria)}</span>
                <span class="tag-chip">🌍 ${escapeHtml(r.origen)}</span>
              </div>
              <span class="recipe-cost-pill">$${r.costoEstimado.mxn} MXN ($${r.costoEstimado.usd} USD)</span>
            </div>
            <div class="recipe-body">
              <div>
                <h4>${escapeHtml(r.nombre)}</h4>
                <div class="ingredients-preview">${previewIngs}</div>
                <p class="recipe-excerpt">${shortInstructions}</p>
              </div>
              <div class="recipe-footer">
                <span><strong>${r.totalIngredientes}</strong> ingredientes</span>
                <button type="button" class="btn btn-sm btn-secondary btn-open-modal" data-idx="${idx}">
                  Ver Ficha Técnica →
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    document.querySelectorAll('.btn-open-modal').forEach((btn) => {
      btn.addEventListener('click', () => {
        const recipe = currentRecipesCache[Number(btn.dataset.idx)];
        if (recipe) openRecipeModal(recipe);
      });
    });
  }

  async function searchRecipesByQuery(query) {
    const endpoint = `/api/recipes/search?q=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.exchangeRate) updateExchangeIndicators(data.exchangeRate);
      renderRecipesGrid(data.recipes, endpoint, data.source);
    } catch (err) {
      if (apiStatusBanner) apiStatusBanner.textContent = 'Error al consultar el endpoint de búsqueda.';
    }
  }

  async function searchRecipesByCategory(category) {
    const endpoint = `/api/recipes/category?c=${encodeURIComponent(category)}`;
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.exchangeRate) updateExchangeIndicators(data.exchangeRate);
      renderRecipesGrid(data.recipes, endpoint, data.source);
    } catch (err) {
      if (apiStatusBanner) apiStatusBanner.textContent = 'Error al consultar el endpoint de categoría.';
    }
  }

  const recipeSearchForm = document.getElementById('recipeSearchForm');
  const recipeSearchInput = document.getElementById('recipeSearchInput');
  if (recipeSearchForm) {
    recipeSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = recipeSearchInput.value.trim() || 'Arrabiata';
      document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
      searchRecipesByQuery(q);
    });
  }

  document.querySelectorAll('.cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      searchRecipesByCategory(pill.dataset.category);
    });
  });

  // Modal de Receta
  const recipeModal = document.getElementById('recipeModal');
  const modalRecipeContent = document.getElementById('modalRecipeContent');
  const closeModalBtn = document.getElementById('closeModalBtn');

  function openRecipeModal(recipe) {
    const ingItems = (recipe.ingredientes || [])
      .map((i) => `<li><strong>${escapeHtml(i.ingrediente)}:</strong> ${escapeHtml(i.medida)}</li>`)
      .join('');

    modalRecipeContent.innerHTML = `
      <span class="section-kicker">${escapeHtml(recipe.categoria)} • ORIGEN: ${escapeHtml(recipe.origen)}</span>
      <h2 id="modalRecipeTitle" style="font-family:var(--font-serif);margin-bottom:0.8rem;">${escapeHtml(recipe.nombre)}</h2>
      <p style="margin-bottom:1rem;font-size:0.9rem;color:#475569;">
        <strong>Costo Estimado Calculado vía API:</strong> $${recipe.costoEstimado.mxn} MXN ($${recipe.costoEstimado.usd} USD a tipo de cambio $${recipe.costoEstimado.tipoCambioAplicado} MXN/USD)
      </p>
      <h4 style="margin-bottom:0.4rem;">Ingredientes y Proporciones (${recipe.totalIngredientes}):</h4>
      <ul style="columns:2;margin-left:1.2rem;margin-bottom:1.1rem;font-size:0.88rem;">${ingItems}</ul>
      <h4 style="margin-bottom:0.4rem;">Método de Preparación:</h4>
      <p style="white-space:pre-line;font-size:0.89rem;color:#1e293b;">${escapeHtml(recipe.instrucciones)}</p>
    `;
    recipeModal.classList.remove('hidden');
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => recipeModal.classList.add('hidden'));
  }
  if (recipeModal) {
    recipeModal.addEventListener('click', (e) => {
      if (e.target === recipeModal) recipeModal.classList.add('hidden');
    });
  }

  // ==========================================================================
  // 4. VALIDACIÓN DE FORMULARIO EN TIEMPO REAL Y ENVÍO A /api/auth/register
  // ==========================================================================
  const registerForm = document.getElementById('registerForm');
  const inputNombre = document.getElementById('inputNombre');
  const inputUsuario = document.getElementById('inputUsuario');
  const inputEmail = document.getElementById('inputEmail');
  const inputTelefono = document.getElementById('inputTelefono');
  const inputEspecialidad = document.getElementById('inputEspecialidad');
  const inputPassword = document.getElementById('inputPassword');
  const inputConfirmPassword = document.getElementById('inputConfirmPassword');
  const inputPrivacidad = document.getElementById('inputPrivacidad');
  const formGlobalAlert = document.getElementById('formGlobalAlert');
  const cryptoReceiptBody = document.getElementById('cryptoReceiptBody');

  function setFieldState(fieldName, isValid, errorMsg = '') {
    const group = document.getElementById(`group-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (!group || !errorEl) return isValid;

    if (isValid) {
      group.classList.remove('is-invalid');
      group.classList.add('is-valid');
      errorEl.textContent = '';
    } else {
      group.classList.remove('is-valid');
      group.classList.add('is-invalid');
      errorEl.textContent = errorMsg;
    }
    return isValid;
  }

  function validateNombre() {
    const val = inputNombre.value.trim();
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/;
    if (!val) {
      return setFieldState('nombre', false, 'El nombre completo es obligatorio.');
    }
    if (!regex.test(val)) {
      return setFieldState('nombre', false, 'Ingresa entre 3 y 60 letras únicamente (sin números ni símbolos).');
    }
    return setFieldState('nombre', true);
  }

  function validateUsuario() {
    const val = inputUsuario.value.trim();
    const regex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!val) {
      return setFieldState('usuario', false, 'El nombre de usuario es obligatorio.');
    }
    if (!regex.test(val)) {
      return setFieldState('usuario', false, 'Usa de 4 a 20 caracteres alfanuméricos o guion bajo (_).');
    }
    return setFieldState('usuario', true);
  }

  function validateEmail() {
    const val = inputEmail.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!val) {
      return setFieldState('email', false, 'El correo electrónico es obligatorio.');
    }
    if (!regex.test(val)) {
      return setFieldState('email', false, 'Formato de correo inválido (ejemplo: chef@utslrc.edu.mx).');
    }
    return setFieldState('email', true);
  }

  function validateTelefono() {
    const val = inputTelefono.value.trim();
    if (!/^\d{10}$/.test(val)) {
      return setFieldState('telefono', false, 'El teléfono debe contener exactamente 10 dígitos numéricos.');
    }
    return setFieldState('telefono', true);
  }

  function validateEspecialidad() {
    const val = inputEspecialidad.value;
    if (!val) {
      return setFieldState('especialidad', false, 'Selecciona una especialidad gastronómica de la lista.');
    }
    return setFieldState('especialidad', true);
  }

  function updateRuleItem(id, passed, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('passed', passed);
    el.textContent = `${passed ? '✔' : '○'} ${text}`;
  }

  function validatePassword() {
    const val = inputPassword.value;
    const hasLen = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /\d/.test(val);
    const hasSpec = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val);

    updateRuleItem('rule-len', hasLen, 'Mínimo 8 caracteres');
    updateRuleItem('rule-upper', hasUpper, '1 letra mayúscula (A-Z)');
    updateRuleItem('rule-lower', hasLower, '1 letra minúscula (a-z)');
    updateRuleItem('rule-num', hasNum, '1 número (0-9)');
    updateRuleItem('rule-spec', hasSpec, '1 símbolo especial (!@#$%^&*)');

    const score = [hasLen, hasUpper, hasLower, hasNum, hasSpec].filter(Boolean).length;
    const bar = document.getElementById('passwordStrengthBar');
    const label = document.getElementById('passwordStrengthLabel');

    if (bar && label) {
      const pct = (score / 5) * 100;
      bar.style.width = `${pct}%`;
      if (score <= 2) {
        bar.style.backgroundColor = '#dc2626';
        label.textContent = 'Débil';
        label.style.color = '#dc2626';
      } else if (score <= 4) {
        bar.style.backgroundColor = '#d97706';
        label.textContent = 'Media';
        label.style.color = '#d97706';
      } else {
        bar.style.backgroundColor = '#15803d';
        label.textContent = 'Fuerte (OWASP)';
        label.style.color = '#15803d';
      }
    }

    if (score < 5) {
      return setFieldState(
        'password',
        false,
        'La contraseña debe cumplir los 5 requisitos de complejidad (8+ caracteres, mayúscula, minúscula, número y símbolo).'
      );
    }
    return setFieldState('password', true);
  }

  function validateConfirmPassword() {
    const pass = inputPassword.value;
    const confirm = inputConfirmPassword.value;
    if (!confirm) {
      return setFieldState('confirmPassword', false, 'Debes confirmar tu contraseña.');
    }
    if (pass !== confirm) {
      return setFieldState('confirmPassword', false, 'Las contraseñas no coinciden.');
    }
    return setFieldState('confirmPassword', true);
  }

  function validatePrivacidad() {
    if (!inputPrivacidad.checked) {
      return setFieldState(
        'aceptaPrivacidad',
        false,
        'Es obligatorio aceptar el Aviso de Privacidad y Derechos ARCO (LFPDPPP).'
      );
    }
    return setFieldState('aceptaPrivacidad', true);
  }

  function validateAllFields() {
    const v1 = validateNombre();
    const v2 = validateUsuario();
    const v3 = validateEmail();
    const v4 = validateTelefono();
    const v5 = validateEspecialidad();
    const v6 = validatePassword();
    const v7 = validateConfirmPassword();
    const v8 = validatePrivacidad();
    return v1 && v2 && v3 && v4 && v5 && v6 && v7 && v8;
  }

  // Eventos en tiempo real
  inputNombre.addEventListener('input', validateNombre);
  inputUsuario.addEventListener('input', validateUsuario);
  inputEmail.addEventListener('input', validateEmail);
  inputTelefono.addEventListener('input', validateTelefono);
  inputEspecialidad.addEventListener('change', validateEspecialidad);
  inputPassword.addEventListener('input', () => {
    validatePassword();
    if (inputConfirmPassword.value) validateConfirmPassword();
  });
  inputConfirmPassword.addEventListener('input', validateConfirmPassword);
  inputPrivacidad.addEventListener('change', validatePrivacidad);

  async function loadRegisteredUsers() {
    const tbody = document.getElementById('registeredUsersTableBody');
    const badge = document.getElementById('totalUsersBadge');
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (badge) badge.textContent = `${data.total} registrados`;
      if (tbody && Array.isArray(data.users)) {
        tbody.innerHTML = data.users
          .map(
            (u) => `
          <tr>
            <td>
              <strong>${escapeHtml(u.id)}</strong><br/>
              <code>@${escapeHtml(u.usuario)}</code>
            </td>
            <td>
              <strong>${escapeHtml(u.nombre)}</strong><br/>
              <small style="color:#475569;">${escapeHtml(u.especialidad)}</small>
            </td>
            <td>
              <span>${escapeHtml(u.emailMasked)}</span><br/>
              <small style="color:#64748b;">Tel: ${escapeHtml(u.telefonoMasked)}</small>
            </td>
            <td>
              <code>${escapeHtml(u.hashPreview)}</code>
            </td>
          </tr>
        `
          )
          .join('');
      }
    } catch (_) {
      // Ignorar
    }
  }

  function showGlobalAlert(type, message) {
    formGlobalAlert.className = `form-global-alert ${type === 'error' ? 'alert-error' : 'alert-success'}`;
    formGlobalAlert.innerHTML = message;
  }

  async function submitRegistration() {
    const isClientValid = validateAllFields();
    if (!isClientValid) {
      showGlobalAlert(
        'error',
        '❌ <strong>Validación detenida:</strong> Por favor corrige los campos marcados en rojo antes de enviar los datos al servidor.'
      );
      return;
    }

    const payload = {
      nombre: inputNombre.value.trim(),
      usuario: inputUsuario.value.trim(),
      email: inputEmail.value.trim(),
      telefono: inputTelefono.value.trim(),
      especialidad: inputEspecialidad.value,
      password: inputPassword.value,
      confirmPassword: inputConfirmPassword.value,
      aceptaPrivacidad: inputPrivacidad.checked
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.errors) {
          Object.entries(data.errors).forEach(([field, msg]) => setFieldState(field, false, msg));
        }
        showGlobalAlert('error', `❌ <strong>Error del Servidor:</strong> ${escapeHtml(data.message)}`);
        return;
      }

      showGlobalAlert(
        'success',
        `✅ <strong>¡Registro Exitoso!</strong> El usuario <code>@${escapeHtml(
          data.user.usuario
        )}</code> fue validado, su contraseña se cifró con <code>scrypt</code> y se emitió un token JWT firmado.`
      );

      cryptoReceiptBody.innerHTML = `
        <div class="receipt-grid">
          <div class="receipt-row">
            <strong>Usuario Registrado y Sanitizado (Anti-XSS)</strong>
            <span>${escapeHtml(data.user.nombre)} (<code>@${escapeHtml(data.user.usuario)}</code>) — ${escapeHtml(
        data.user.email
      )}</span>
          </div>
          <div class="receipt-row">
            <strong>Algoritmo de Hash de Contraseña</strong>
            <span>${escapeHtml(data.securityAudit.passwordAlgorithm)}</span>
          </div>
          <div class="receipt-row">
            <strong>Hash Derivado Almacenado (scrypt + salt)</strong>
            <code>${escapeHtml(data.securityAudit.passwordHashPreview)}</code>
          </div>
          <div class="receipt-row">
            <strong>Token JWT Firmado (HS256 con JWT_SECRET en .env)</strong>
            <code>${escapeHtml(data.securityAudit.jwtToken)}</code>
          </div>
        </div>
      `;

      await loadRegisteredUsers();
      await loadSecurityStatus();
    } catch (err) {
      showGlobalAlert('error', '❌ Error de red al comunicar con /api/auth/register.');
    }
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRegistration();
  });

  // Botones de demostración rápida para pruebas y capturas
  function triggerDemoErrors() {
    inputNombre.value = 'Chef 12345 @#';
    inputUsuario.value = 'ab';
    inputEmail.value = 'correo-sin-formato-valido';
    inputTelefono.value = '65312';
    inputEspecialidad.value = '';
    inputPassword.value = '12345';
    inputConfirmPassword.value = '99999';
    inputPrivacidad.checked = false;
    validateAllFields();
    showGlobalAlert(
      'error',
      '⚠️ <strong>Validación Activa:</strong> Se detectaron 8 errores de formato y seguridad en el formulario. Revisa los mensajes de retroalimentación en cada campo.'
    );
  }

  async function triggerDemoSuccess() {
    const suffix = Math.floor(100 + Math.random() * 899);
    inputNombre.value = 'Elena Reygadas Mendoza';
    inputUsuario.value = `chef_elena_${suffix}`;
    inputEmail.value = `elena.reygadas${suffix}@gastronomia.mx`;
    inputTelefono.value = '6531984720';
    inputEspecialidad.value = 'Alta Cocina Internacional';
    inputPassword.value = 'Gastronomia#2026';
    inputConfirmPassword.value = 'Gastronomia#2026';
    inputPrivacidad.checked = true;
    await submitRegistration();
  }

  const btnSimulateErrors = document.getElementById('btnSimulateErrors');
  const btnSimulateValid = document.getElementById('btnSimulateValid');
  if (btnSimulateErrors) btnSimulateErrors.addEventListener('click', triggerDemoErrors);
  if (btnSimulateValid) btnSimulateValid.addEventListener('click', triggerDemoSuccess);

  // ==========================================================================
  // 5. PANEL DE SEGURIDAD UNIDAD 3 (/api/security/status)
  // ==========================================================================
  const envLiveMetrics = document.getElementById('envLiveMetrics');
  const securityControlsList = document.getElementById('securityControlsList');
  const jsonInspectorOutput = document.getElementById('jsonInspectorOutput');

  async function loadSecurityStatus() {
    try {
      const res = await fetch('/api/security/status');
      const data = await res.json();

      if (data.liveExchangeRate) updateExchangeIndicators(data.liveExchangeRate);

      if (envLiveMetrics && data.ambiente) {
        envLiveMetrics.innerHTML = `
          <div class="env-item">
            <strong>Estado de dotenv en Node.js:</strong>
            <span class="badge-pill badge-success">${data.ambiente.dotenvLoaded ? 'CARGADO CORRECTAMENTE' : 'FALLBACK'}</span>
          </div>
          <div class="env-item">
            <strong>MEALDB_API_KEY (Enmascarada):</strong> <code>${escapeHtml(data.ambiente.mealDbApiKeyMasked)}</code>
          </div>
          <div class="env-item">
            <strong>Huella SHA-256 de JWT_SECRET:</strong> <code>${escapeHtml(data.ambiente.jwtSecretFingerprint)}...</code>
          </div>
          <div class="env-item">
            <strong>Protección .gitignore:</strong> <code>.env</code> y <code>node_modules/</code> excluidos del control de versiones.
          </div>
        `;
      }

      if (securityControlsList && Array.isArray(data.controlesSeguridad)) {
        securityControlsList.innerHTML = data.controlesSeguridad
          .map(
            (c) => `
          <div class="control-item">
            <div class="control-item-top">
              <strong>${escapeHtml(c.control)}</strong>
              <span class="badge-pill badge-success">${escapeHtml(c.estado)}</span>
            </div>
            <p style="color:#475569;font-size:0.81rem;">${escapeHtml(c.detalle)}</p>
          </div>
        `
          )
          .join('');
      }

      if (jsonInspectorOutput) {
        jsonInspectorOutput.textContent = JSON.stringify(data, null, 2);
      }
    } catch (_) {
      // Ignorar
    }
  }

  document.querySelectorAll('[data-inspect]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const endpoint = btn.dataset.inspect;
      jsonInspectorOutput.textContent = `Consultando ${endpoint}...`;
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        jsonInspectorOutput.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        jsonInspectorOutput.textContent = `Error al consultar ${endpoint}`;
      }
    });
  });

  // ==========================================================================
  // 6. INICIALIZACIÓN Y SOPORTE DE PARÁMETROS URL PARA DEMO/CAPTURAS
  // ==========================================================================
  const initialHash = window.location.hash.replace('#', '').trim();
  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get('screen');
  const demoParam = params.get('demo');

  if (screenParam && VALID_ROUTES.includes(screenParam)) {
    switchScreen(screenParam);
  } else if (initialHash && VALID_ROUTES.includes(initialHash)) {
    switchScreen(initialHash);
  }

  // Carga inicial de datos desde el backend
  loadHeroFeaturedRecipe();
  searchRecipesByCategory('Seafood');
  loadRegisteredUsers();
  loadSecurityStatus();

  if (demoParam === 'errors') {
    switchScreen('registro');
    setTimeout(triggerDemoErrors, 150);
  } else if (demoParam === 'success') {
    switchScreen('registro');
    setTimeout(triggerDemoSuccess, 150);
  }
});
