let db
let categoriaEditandoId = null
let productoEditandoId = null


document.addEventListener("DOMContentLoaded", () => {
  const request = window.indexedDB.open("MuebleriaDB", 1)

  request.onerror = (error) => {
    console.log("Error al abrir la base de datos", error)
  }

  request.onsuccess = (event) => {
    db = event.target.result
    console.log("Base de datos lista")
    cargarCategorias()
    mostrarCategorias()
    mostrarProductos()
  }

  request.onupgradeneeded = (event) => {
    db = event.target.result


    const objetoCategoria = db.createObjectStore("categorias", {
      keyPath: "id",
      autoIncrement: true,
    })
    objetoCategoria.createIndex("nombre", "nombre", { unique: false })
    objetoCategoria.createIndex("descripcion", "descripcion", { unique: false })


    const objetoProducto = db.createObjectStore("productos", {
      keyPath: "id",
      autoIncrement: true,
    })
    objetoProducto.createIndex("nombre", "nombre", { unique: false })
    objetoProducto.createIndex("precio", "precio", { unique: false })
    objetoProducto.createIndex("categoria", "categoria", { unique: false })

    console.log("Objetos creados en la base de datos")
  }


  document.getElementById("formularioCategoria").addEventListener("submit", agregarCategoria)
  document.getElementById("formularioProducto").addEventListener("submit", agregarProducto)
  document.getElementById("formularioEditarCategoria").addEventListener("submit", actualizarCategoriaDesdeModal)
  document.getElementById("formularioEditar").addEventListener("submit", actualizarProductoDesdeModal)

  const closeButtons = document.querySelectorAll(".cerrar-modal")
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.classList.remove("activo")
      }
    })
  })

  window.onclick = (event) => {
    const modalEditar = document.getElementById("modalEditar")
    const modalEliminar = document.getElementById("modalEliminar")
    const modalEditarCategoria = document.getElementById("modalEditarCategoria")
    const modalEliminarCategoria = document.getElementById("modalEliminarCategoria")

    if (event.target === modalEditar) {
      cerrarModalEditar()
    }
    if (event.target === modalEliminar) {
      cerrarModalEliminar()
    }
    if (event.target === modalEditarCategoria) {
      cerrarModalEditarCategoria()
    }
    if (event.target === modalEliminarCategoria) {
      cerrarModalEliminarCategoria()
    }
  }
})


function agregarCategoria(e) {
  e.preventDefault()
  const nombre = document.getElementById("nombreCategoria").value.trim()
  const descripcion = document.getElementById("descripcionCategoria").value.trim()

  if (!nombre || !descripcion) {
    return alert("Todos los campos son obligatorios")
  }

  const transaccion = db.transaction("categorias", "readwrite")
  const objectStore = transaccion.objectStore("categorias")
  const categoria = { nombre, descripcion }
  const request = objectStore.add(categoria)

  request.onerror = (error) => {
    console.log("Error al agregar categoría", error)
  }

  request.onsuccess = () => {
    console.log("Categoría agregada")
    e.target.reset()
    cargarCategorias()
    mostrarCategorias()
    alert("Categoría agregada exitosamente")
  }
}

function mostrarCategorias() {
  const tbody = document.getElementById("tablaCategoriasBody")

  if (!tbody) {
    console.error("ERROR: No se encontró el elemento tablaCategoriasBody")
    return
  }

  tbody.innerHTML = ""

  if (!db) {
    console.error("ERROR: Base de datos no inicializada")
    return
  }

  const transaccion = db.transaction("categorias", "readonly")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.openCursor()

  let categoriaCount = 0

  request.onsuccess = (event) => {
    const cursor = event.target.result
    if (cursor) {
      categoriaCount++
      const categoria = cursor.value
      const fila = document.createElement("tr")
      fila.innerHTML = `
                <td>${categoria.nombre}</td>
                <td>${categoria.descripcion}</td>
                <td>
                    <button class="btn-tabla" onclick="abrirModalEditarCategoria(${categoria.id})">Actualizar</button>
                    <button class="btn-tabla borrar" onclick="abrirModalEliminarCategoria(${categoria.id})">Borrar</button>
                </td>
            `
      tbody.appendChild(fila)
      cursor.continue()
    } else {
      if (categoriaCount === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" style="text-align: center; color: #999; padding: 1rem;">No hay categorías registradas</td></tr>'
      }
    }
  }

  request.onerror = (error) => {
    console.error("Error al mostrar categorías:", error)
  }
}

function cargarCategorias() {
  const select = document.getElementById("categoriaProducto")
  select.innerHTML = '<option value="">--Seleccionar--</option>'

  const transaccion = db.transaction("categorias", "readonly")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.openCursor()

  request.onsuccess = (event) => {
    const cursor = event.target.result
    if (cursor) {
      const categoria = cursor.value
      const option = document.createElement("option")
      option.value = categoria.nombre
      option.textContent = categoria.nombre
      option.dataset.id = categoria.id
      select.appendChild(option)
      cursor.continue()
    }
  }
}

function abrirModalEditarCategoria(id) {
  categoriaEditandoId = id
  const transaccion = db.transaction("categorias", "readonly")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.get(id)

  request.onsuccess = (event) => {
    const categoria = event.target.result
    document.getElementById("nombreCategoriaEditModal").value = categoria.nombre
    document.getElementById("descripcionCategoriaEditModal").value = categoria.descripcion
    document.getElementById("modalEditarCategoria").classList.add("activo")
  }
}

function cerrarModalEditarCategoria() {
  document.getElementById("modalEditarCategoria").classList.remove("activo")
  document.getElementById("formularioEditarCategoria").reset()
  categoriaEditandoId = null
}

function actualizarCategoriaDesdeModal(e) {
  e.preventDefault()

  if (!categoriaEditandoId) return

  const nombre = document.getElementById("nombreCategoriaEditModal").value.trim()
  const descripcion = document.getElementById("descripcionCategoriaEditModal").value.trim()

  if (!nombre || !descripcion) {
    return alert("Todos los campos son obligatorios")
  }

  const transaccion = db.transaction("categorias", "readwrite")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.get(categoriaEditandoId)

  request.onsuccess = (event) => {
    const categoria = event.target.result
    categoria.nombre = nombre
    categoria.descripcion = descripcion

    const requestUpdate = objectStore.put(categoria)
    requestUpdate.onsuccess = () => {
      alert("Categoría actualizada exitosamente")
      cerrarModalEditarCategoria()
      cargarCategorias()
      mostrarCategorias()
    }
  }
}

function abrirModalEliminarCategoria(id) {
  categoriaEditandoId = id
  document.getElementById("modalEliminarCategoria").classList.add("activo")
}

function cerrarModalEliminarCategoria() {
  document.getElementById("modalEliminarCategoria").classList.remove("activo")
  categoriaEditandoId = null
}

function confirmarEliminarCategoria() {
  if (!categoriaEditandoId) return

  const transaccion = db.transaction("categorias", "readwrite")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.delete(categoriaEditandoId)

  request.onsuccess = () => {
    alert("Categoría eliminada exitosamente")
    cerrarModalEliminarCategoria()
    cargarCategorias()
    mostrarCategorias()
  }
}


function agregarProducto(e) {
  e.preventDefault()
  const nombre = document.getElementById("nombreProducto").value.trim()
  const precio = document.getElementById("precioProducto").value.trim()
  const categoria = document.getElementById("categoriaProducto").value.trim()

  if (!nombre || !precio || !categoria) {
    return alert("Todos los campos son obligatorios")
  }

  const transaccion = db.transaction("productos", "readwrite")
  const objectStore = transaccion.objectStore("productos")
  const producto = { nombre, precio: Number.parseFloat(precio), categoria }
  const request = objectStore.add(producto)

  request.onerror = (error) => {
    console.log("Error al agregar producto", error)
  }

  request.onsuccess = () => {
    console.log("Producto agregado")
    e.target.reset()
    mostrarProductos()
    alert("Producto agregado exitosamente")
  }
}

function mostrarProductos() {
  const tbody = document.getElementById("tablaProductosBody")
  tbody.innerHTML = ""

  const transaccion = db.transaction("productos", "readonly")
  const objectStore = transaccion.objectStore("productos")
  const request = objectStore.openCursor()

  request.onsuccess = (event) => {
    const cursor = event.target.result
    if (cursor) {
      const producto = cursor.value
      const fila = document.createElement("tr")
      fila.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.precio} Bs</td>
                <td>${producto.categoria}</td>
                <td>
                    <button class="btn-tabla" onclick="abrirModalEditar(${producto.id})">Actualizar</button>
                    <button class="btn-tabla borrar" onclick="abrirModalEliminar(${producto.id})">Borrar</button>
                </td>
            `
      tbody.appendChild(fila)
      cursor.continue()
    }
  }
}

function abrirModalEditar(id) {
  productoEditandoId = id
  const transaccion = db.transaction("productos", "readonly")
  const objectStore = transaccion.objectStore("productos")
  const request = objectStore.get(id)

  request.onsuccess = (event) => {
    const producto = event.target.result
    document.getElementById("nombreProductoEdit").value = producto.nombre
    document.getElementById("precioProductoEdit").value = producto.precio


    cargarCategoriasModal()


    setTimeout(() => {
      document.getElementById("categoriaProductoEdit").value = producto.categoria
    }, 100)

    document.getElementById("modalEditar").classList.add("activo")
  }
}

function cargarCategoriasModal() {
  const select = document.getElementById("categoriaProductoEdit")
  select.innerHTML = '<option value="">--Seleccionar--</option>'

  const transaccion = db.transaction("categorias", "readonly")
  const objectStore = transaccion.objectStore("categorias")
  const request = objectStore.openCursor()

  request.onsuccess = (event) => {
    const cursor = event.target.result
    if (cursor) {
      const categoria = cursor.value
      const option = document.createElement("option")
      option.value = categoria.nombre
      option.textContent = categoria.nombre
      select.appendChild(option)
      cursor.continue()
    }
  }
}

function cerrarModalEditar() {
  document.getElementById("modalEditar").classList.remove("activo")
  document.getElementById("formularioEditar").reset()
  productoEditandoId = null
}

function actualizarProductoDesdeModal(e) {
  e.preventDefault()

  if (!productoEditandoId) return

  const nombre = document.getElementById("nombreProductoEdit").value.trim()
  const precio = document.getElementById("precioProductoEdit").value.trim()
  const categoria = document.getElementById("categoriaProductoEdit").value.trim()

  if (!nombre || !precio || !categoria) {
    return alert("Todos los campos son obligatorios")
  }

  const transaccion = db.transaction("productos", "readwrite")
  const objectStore = transaccion.objectStore("productos")
  const request = objectStore.get(productoEditandoId)

  request.onsuccess = (event) => {
    const producto = event.target.result
    producto.nombre = nombre
    producto.precio = Number.parseFloat(precio)
    producto.categoria = categoria

    const requestUpdate = objectStore.put(producto)
    requestUpdate.onsuccess = () => {
      alert("Producto actualizado exitosamente")
      cerrarModalEditar()
      mostrarProductos()
    }
  }
}

function abrirModalEliminar(id) {
  productoEditandoId = id
  document.getElementById("modalEliminar").classList.add("activo")
}

function cerrarModalEliminar() {
  document.getElementById("modalEliminar").classList.remove("activo")
  productoEditandoId = null
}

function confirmarEliminar() {
  if (!productoEditandoId) return

  const transaccion = db.transaction("productos", "readwrite")
  const objectStore = transaccion.objectStore("productos")
  const request = objectStore.delete(productoEditandoId)

  request.onsuccess = () => {
    alert("Producto eliminado exitosamente")
    cerrarModalEliminar()
    mostrarProductos()
  }
}
